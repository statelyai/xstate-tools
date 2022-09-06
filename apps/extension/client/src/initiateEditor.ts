import { parseMachinesFromFile } from '@xstate/machine-extractor';
import {
  filterOutIgnoredMachines,
  getInlineImplementations,
  ImplementationsMetadata,
  isCursorInPosition,
  resolveUriToFilePrefix
} from '@xstate/tools-shared';
import * as path from 'path';
import * as vscode from 'vscode';
import { ColorThemeKind } from 'vscode';
import { createMachine, interpret, MachineConfig } from 'xstate';
import { forwardTo } from 'xstate/lib/actions';
import { handleDefinitionUpdate } from './handleDefinitionUpdate';
import { handleNodeSelected } from './handleNodeSelected';
import * as typeSafeVsCode from './typeSafeVsCode';

type NodeSelectedEvent = {
  type: 'NODE_SELECTED';
  path: string[];
  uri: string;
  index: number;
};

type OpenLinkEvent = {
  type: 'OPEN_LINK';
  url: string;
};

type DefinitionUpdatedEvent = {
  type: 'DEFINITION_UPDATED';
  config: MachineConfig<any, any, any>;
  layoutString: string;
  implementations: ImplementationsMetadata;
};

type StudioEvent = NodeSelectedEvent | OpenLinkEvent | DefinitionUpdatedEvent;

function removeFromMutableArray<T>(array: T[], item: T) {
  const index = array.indexOf(item);
  if (index !== -1) {
    array.splice(index, 1);
  }
}

function registerDisposable(
  extensionContext: vscode.ExtensionContext,
  disposable: vscode.Disposable,
) {
  extensionContext.subscriptions.push(disposable);
  return () => {
    removeFromMutableArray(extensionContext.subscriptions, disposable);
    disposable.dispose();
  };
}

function registerCommand<Name extends keyof typeSafeVsCode.XStateCommands>(
  extensionContext: vscode.ExtensionContext,
  ...[name, handler]: Parameters<typeof typeSafeVsCode.registerCommand<Name>>
) {
  return registerDisposable(
    extensionContext,
    typeSafeVsCode.registerCommand(name, handler),
  );
}

async function getWebviewHtml(
  extensionContext: vscode.ExtensionContext,
  webviewPanel: vscode.WebviewPanel,
  {
    config,
    implementations,
    layoutString,
  }: {
    config: MachineConfig<any, any, any>;
    layoutString: string | undefined;
    implementations: ImplementationsMetadata;
  },
) {
  const bundledEditorRootUri = vscode.Uri.file(
    path.join(extensionContext.extensionPath, 'bundled-editor'),
  );
  const htmlContent = new TextDecoder().decode(
    await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(bundledEditorRootUri, 'index.html'),
    ),
  );

  const baseTag = `<base href="${webviewPanel.webview.asWebviewUri(
    bundledEditorRootUri,
  )}/">`;

  // TODO: atm this is not refreshed with the theme changes
  const settingsTheme = typeSafeVsCode.getConfiguration('theme') ?? 'auto';

  const initialDataScript = `<script>window.__params = ${JSON.stringify({
    themeKind:
      settingsTheme === 'auto'
        ? vscode.window.activeColorTheme.kind === ColorThemeKind.Dark
          ? 'dark'
          : 'light'
        : settingsTheme,
    config,
    layoutString,
    implementations,
  })}</script>`;

  return htmlContent.replace('<head>', `<head>${baseTag}${initialDataScript}`);
}

// this should not be an async function, it should return `webviewPanel` synchronously
// to allow the consumer to start listening to events from the webview immediately
function createWebviewPanel() {
  // TODO: this should have more strict CSP rules
  return vscode.window.createWebviewPanel(
    'editor',
    'XState Editor',
    vscode.ViewColumn.Beside,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );
}

type WebviewClosed = { type: 'WEBVIEW_CLOSED' };

type EditMachine = {
  type: 'EDIT_MACHINE';
  config: MachineConfig<any, any, any>;
  index: number;
  uri: string;
  layoutString: string | undefined;
  implementations: ImplementationsMetadata;
};

type MachineTextChanged = {
  type: 'MACHINE_TEXT_CHANGED';
  config: MachineConfig<any, any, any>;
  index: number;
  uri: string;
  layoutString: string | undefined;
  implementations: ImplementationsMetadata;
};

const machine = createMachine(
  {
    predictableActionArguments: true,
    tsTypes: {} as import('./initiateEditor.typegen').Typegen0,
    schema: {
      events: {} as WebviewClosed | EditMachine | MachineTextChanged,
    },
    context: {
      extensionContext: null! as vscode.ExtensionContext,
    },
    invoke: [
      {
        src: 'registerEditAtCursorPositionCommand',
      },
      {
        src: 'registerEditOnCodeLensClickCommand',
      },
    ],
    initial: 'idle',
    states: {
      idle: {
        on: {
          EDIT_MACHINE: 'openWebview',
        },
      },
      // this is somewhat weirdly nested but it allows us to isolate a state in which the webview is open
      // and the one in which we are editing a concrete machine
      // thanks to that we can reenter the editing state without having to re-open the webview
      openWebview: {
        invoke: [
          {
            id: 'webview',
            src: 'webviewActor',
          },
        ],
        on: {
          WEBVIEW_CLOSED: 'idle',
        },
        initial: 'editing',
        states: {
          editing: {
            invoke: {
              src: 'onDidChangeTextDocumentListener',
            },
            on: {
              EDIT_MACHINE: {
                target: 'editing',
                // we want to reload~ the content of the webview when somebody starts editing potentially a completely different machine
                // we gonna reenter the editing state with the new machine
                internal: false,
                actions: 'forwardToWebview',
              },
              MACHINE_TEXT_CHANGED: {
                actions: 'forwardToWebview',
              },
            },
          },
        },
      },
    },
  },
  {
    actions: {
      forwardToWebview: forwardTo('webview'),
    },
    services: {
      registerEditAtCursorPositionCommand:
        ({ extensionContext }) =>
        (sendBack) =>
          registerCommand(extensionContext, 'stately-xstate.edit', () => {
            try {
              const activeTextEditor = vscode.window.activeTextEditor!;
              const currentSelection = activeTextEditor.selection;
              const currentText = activeTextEditor.document.getText();

              const result = filterOutIgnoredMachines(
                parseMachinesFromFile(currentText),
              );

              const foundIndex = result.machines.findIndex((machine) => {
                if (
                  machine?.ast?.definition?.node?.loc ||
                  machine?.ast?.options?.node?.loc
                ) {
                  const isInPosition =
                    isCursorInPosition(
                      machine?.ast?.definition?.node?.loc!,
                      currentSelection.start,
                    ) ||
                    isCursorInPosition(
                      machine?.ast?.options?.node?.loc!,
                      currentSelection.start,
                    );

                  if (isInPosition) {
                    return true;
                  }
                }
                return false;
              });

              if (foundIndex === -1) {
                vscode.window.showErrorMessage(
                  'Could not find a machine at the current cursor.',
                );
                return;
              }

              const machine = result.machines[foundIndex];
              const implementations = getInlineImplementations(
                machine,
                currentText,
              );

              sendBack({
                type: 'EDIT_MACHINE',
                config: machine.toConfig({ hashInlineImplementations: true })!,

                index: foundIndex,
                uri: resolveUriToFilePrefix(
                  vscode.window.activeTextEditor!.document.uri.path,
                ),
                layoutString: machine.getLayoutComment()?.value,
                implementations,
              });
            } catch (e) {
              vscode.window.showErrorMessage(
                'Could not find a machine at the current cursor.',
              );
            }
          }),
      registerEditOnCodeLensClickCommand:
        ({ extensionContext }) =>
        (sendBack) =>
          registerCommand(
            extensionContext,
            'stately-xstate.edit-code-lens',
            (config, machineIndex, uri, layoutString) => {
              const activeTextEditor = vscode.window.activeTextEditor!;
              const currentText = activeTextEditor.document.getText();

              const result = filterOutIgnoredMachines(
                parseMachinesFromFile(currentText),
              );

              const machine = result.machines[machineIndex];

              const implementations = getInlineImplementations(
                machine,
                currentText,
              );

              sendBack({
                type: 'EDIT_MACHINE',
                config,
                index: machineIndex,
                uri,
                layoutString,
                implementations,
              });
            },
          ),
      onDidChangeTextDocumentListener:
        ({ extensionContext }, { uri, index }) =>
        (sendBack) => {
          // TODO: debounce?
          return registerDisposable(
            extensionContext,
            vscode.workspace.onDidChangeTextDocument(({ document }) => {
              if (uri !== resolveUriToFilePrefix(document.uri.path)) {
                return;
              }
              // TODO: try to avoid resetting the whole thing when document is edited outside of the config
              const text = document.getText();

              /*
               * If we already sent the text, don't send it again.
               * We need this because onDidChangeTextDocument gets called multiple times on a save.
               * In theory multiple documents could have the same text content, so we prepend the path to the text to make it unique.
               */
              // if (document.uri.path + text === lastSentPathAndText) return;

              // TODO: only listen to changes to the currently edited machine
              const parsed = parseMachinesFromFile(text);
              if (parsed.machines.length > 0) {
                // lastSentPathAndText = document.uri.path + text;
                // TODO: this is far from ideal, because the index might change if somebody removes a machine preceding the one we are editing
                const machine = parsed.machines[index];

                sendBack({
                  type: 'MACHINE_TEXT_CHANGED',
                  config: machine.toConfig({
                    hashInlineImplementations: true,
                  })!,
                  index,
                  uri: resolveUriToFilePrefix(document.uri.path),
                  layoutString: machine.getLayoutComment()?.value || '',
                  implementations: getInlineImplementations(machine, text),
                });
              }
            }),
          );
        },
      webviewActor:
        (
          { extensionContext },
          {
            config,
            implementations,
            layoutString,
            uri: initialUri,
            index: initialIndex,
          },
        ) =>
        (sendBack, onReceive) => {
          let canceled = false;
          let uri = initialUri;
          let index = initialIndex;

          const webviewPanel = createWebviewPanel();

          const messageListenerDisposable = registerDisposable(
            extensionContext,
            webviewPanel.webview.onDidReceiveMessage((event: StudioEvent) => {
              if (event.type === 'DEFINITION_UPDATED') {
                handleDefinitionUpdate({
                  ...event,
                  index,
                  uri,
                });
              } else if (event.type === 'NODE_SELECTED') {
                handleNodeSelected(event);
              } else if (event.type === 'OPEN_LINK') {
                // TODO: test out if this is even needed now
                vscode.env.openExternal(vscode.Uri.parse(event.url));
              }
            }),
          );

          const panelDisposedListenerDisposable = registerDisposable(
            extensionContext,
            webviewPanel.onDidDispose(() => {
              sendBack({ type: 'WEBVIEW_CLOSED' });
            }),
          );

          onReceive((event: EditMachine | MachineTextChanged) => {
            switch (event.type) {
              case 'EDIT_MACHINE': {
                uri = event.uri;
                index = event.index;

                webviewPanel.reveal(vscode.ViewColumn.Beside);
                webviewPanel.webview.postMessage({
                  type: 'UPDATE_CONFIG',
                  config: event.config,
                  layoutString: event.layoutString,
                  implementations: event.implementations,
                });
                return;
              }
              case 'MACHINE_TEXT_CHANGED': {
                webviewPanel.webview.postMessage({
                  type: 'UPDATE_CONFIG',
                  config: event.config,
                  layoutString: event.layoutString,
                  implementations: event.implementations,
                });
                return;
              }
            }
          });

          (async () => {
            const html = await getWebviewHtml(extensionContext, webviewPanel, {
              config,
              implementations,
              layoutString,
            });
            if (canceled) {
              return;
            }
            webviewPanel.webview.html = html;
          })();

          return () => {
            canceled = true;
            messageListenerDisposable();
            panelDisposedListenerDisposable();
          };
        },
    },
  },
);

export const initiateEditor = (extensionContext: vscode.ExtensionContext) => {
  const service = interpret(machine.withContext({ extensionContext })).start();
  extensionContext.subscriptions.push({ dispose: () => service.stop() });
};
