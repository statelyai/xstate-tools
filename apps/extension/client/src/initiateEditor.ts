import { ExtractorMachineConfig, MachineEdit } from '@xstate/machine-extractor';
import {
  ImplementationsMetadata,
  resolveUriToFilePrefix,
} from '@xstate/tools-shared';
import * as path from 'path';
import * as vscode from 'vscode';
import { ColorThemeKind } from 'vscode';
import { MachineConfig, createMachine, interpret } from 'xstate';
import { forwardTo } from 'xstate/lib/actions';
import { registerDisposable } from './registerDisposable';
import { TypeSafeLanguageClient } from './typeSafeLanguageClient';
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

type MachineChangedEvent = {
  type: 'MACHINE_CHANGED';
  edits: MachineEdit[];
  options?: { v5?: boolean } | undefined;
  reason?: 'undo' | 'redo';
};

type LayoutUpdatedEvent = {
  type: 'LAYOUT_UPDATED';
  layoutString: string;
};

type StudioEvent =
  | NodeSelectedEvent
  | OpenLinkEvent
  | MachineChangedEvent
  | LayoutUpdatedEvent;

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
    config: ExtractorMachineConfig;
    layoutString: string | null;
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
    distinctId: `vscode:${vscode.env.machineId}`,
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
    typeSafeVsCode.getViewColumn(),
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );
}

type WebviewClosed = { type: 'WEBVIEW_CLOSED' };

type EditMachine = {
  type: 'EDIT_MACHINE';
  config: ExtractorMachineConfig;
  index: number;
  uri: string;
  layoutString: string | null;
  implementations: ImplementationsMetadata;
};

type DisplayedMachineUpdated = {
  type: 'DISPLAYED_MACHINE_UPDATED';
  config: ExtractorMachineConfig;
  layoutString: string | null;
  implementations: ImplementationsMetadata;
};

type ExtractionError = {
  type: 'EXTRACTION_ERROR';
  message: string | null;
};

const machine = createMachine(
  {
    predictableActionArguments: true,
    tsTypes: {} as import('./initiateEditor.typegen').Typegen0,
    schema: {
      events: {} as
        | WebviewClosed
        | EditMachine
        | DisplayedMachineUpdated
        | ExtractionError,
    },
    context: {
      extensionContext: null! as vscode.ExtensionContext,
      languageClient: null! as TypeSafeLanguageClient,
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
            entry: ['setEditedMachine'],
            exit: 'clearEditedMachine',
            invoke: {
              src: 'onServerNotificationListener',
            },
            on: {
              EDIT_MACHINE: {
                target: 'editing',
                // we want to reload~ the content of the webview when somebody starts editing potentially a completely different machine
                // we gonna reenter the editing state with the new machine
                internal: false,
                actions: 'forwardToWebview',
              },
              DISPLAYED_MACHINE_UPDATED: {
                actions: 'forwardToWebview',
              },
              EXTRACTION_ERROR: {
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
      setEditedMachine: ({ languageClient }, { uri, index }) => {
        languageClient.sendRequest('setDisplayedMachine', {
          uri,
          machineIndex: index,
        });
      },
      clearEditedMachine: ({ languageClient }) => {
        languageClient.sendRequest('clearDisplayedMachine', undefined);
      },
    },
    services: {
      registerEditAtCursorPositionCommand:
        ({ extensionContext, languageClient }) =>
        (sendBack) =>
          registerCommand(extensionContext, 'stately-xstate.edit', async () => {
            try {
              const activeTextEditor = vscode.window.activeTextEditor!;
              const uri = resolveUriToFilePrefix(
                activeTextEditor.document.uri.path,
              );
              const tokenSource = new vscode.CancellationTokenSource();
              const { config, layoutString, implementations, machineIndex } =
                await languageClient.sendRequest(
                  'getMachineAtCursorPosition',
                  {
                    uri,
                    position: {
                      line: activeTextEditor.selection.start.line,
                      column: activeTextEditor.selection.start.character,
                    },
                  },
                  tokenSource.token,
                );
              sendBack({
                type: 'EDIT_MACHINE',
                config,
                index: machineIndex,
                uri,
                layoutString,
                implementations,
              });
            } catch {
              vscode.window.showErrorMessage(
                'Could not find a machine at the current cursor.',
              );
            }
          }),
      registerEditOnCodeLensClickCommand:
        ({ extensionContext, languageClient }) =>
        (sendBack) =>
          registerCommand(
            extensionContext,
            'stately-xstate.edit-code-lens',
            (uri, machineIndex) => {
              const tokenSource = new vscode.CancellationTokenSource();

              languageClient
                .sendRequest(
                  'getMachineAtIndex',
                  { uri, machineIndex },
                  tokenSource.token,
                )
                .then(({ config, layoutString, implementations }) => {
                  sendBack({
                    type: 'EDIT_MACHINE',
                    config,
                    index: machineIndex,
                    uri,
                    layoutString,
                    implementations,
                  });
                });
            },
          ),
      onServerNotificationListener:
        ({ extensionContext, languageClient }) =>
        (sendBack) => {
          const machineUpdatedDisposable = registerDisposable(
            extensionContext,
            languageClient.onNotification(
              'displayedMachineUpdated',
              ({ config, layoutString, implementations }) => {
                sendBack({
                  type: 'DISPLAYED_MACHINE_UPDATED',
                  config,
                  layoutString,
                  implementations,
                });
              },
            ),
          );

          const extractionErrorDisposable = registerDisposable(
            extensionContext,
            languageClient.onNotification('extractionError', ({ message }) => {
              sendBack({
                type: 'EXTRACTION_ERROR',
                message,
              });
            }),
          );

          return () => {
            machineUpdatedDisposable();
            extractionErrorDisposable();
          };
        },
      webviewActor:
        (
          { extensionContext, languageClient },
          { config, implementations, layoutString, uri: initialUri },
        ) =>
        (sendBack, onReceive) => {
          let canceled = false;
          let uri = initialUri;

          const webviewPanel = createWebviewPanel();

          const messageListenerDisposable = registerDisposable(
            extensionContext,
            webviewPanel.webview.onDidReceiveMessage((event: StudioEvent) => {
              if (event.type === 'MACHINE_CHANGED') {
                languageClient
                  .sendRequest('applyMachineEdits', {
                    machineEdits: event.edits,
                    options: event.options,
                    reason: event.reason,
                  })
                  .then(({ textEdits }) => {
                    const workspaceEdit = new vscode.WorkspaceEdit();
                    for (const textEdit of textEdits) {
                      switch (textEdit.type) {
                        case 'replace': {
                          workspaceEdit.replace(
                            vscode.Uri.parse(textEdit.uri),
                            new vscode.Range(
                              new vscode.Position(
                                textEdit.range[0].line,
                                textEdit.range[0].column,
                              ),
                              new vscode.Position(
                                textEdit.range[1].line,
                                textEdit.range[1].column,
                              ),
                            ),
                            textEdit.newText,
                          );
                          break;
                        }
                      }
                    }
                    return vscode.workspace.applyEdit(workspaceEdit);
                  });
              } else if (event.type === 'NODE_SELECTED') {
                const editor = vscode.window.visibleTextEditors.find(
                  (editor) => String(editor.document.uri) === uri,
                );
                if (!editor) {
                  return;
                }
                languageClient
                  .sendRequest('getNodePosition', { path: event.path })
                  .then((range) => {
                    if (!range) {
                      return;
                    }

                    editor.revealRange(
                      new vscode.Range(
                        new vscode.Position(range[0].line - 1, range[0].column),
                        new vscode.Position(range[1].line - 1, range[1].column),
                      ),
                      vscode.TextEditorRevealType.InCenter,
                    );
                  });
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

          onReceive(
            (
              event: EditMachine | DisplayedMachineUpdated | ExtractionError,
            ) => {
              switch (event.type) {
                case 'EDIT_MACHINE': {
                  uri = event.uri;

                  webviewPanel.reveal(vscode.ViewColumn.Beside);
                  webviewPanel.webview.postMessage({
                    type: 'UPDATE_CONFIG',
                    config: event.config,
                    layoutString: event.layoutString,
                    implementations: event.implementations,
                  });
                  return;
                }
                case 'DISPLAYED_MACHINE_UPDATED': {
                  webviewPanel.webview.postMessage({
                    type: 'UPDATE_CONFIG',
                    config: event.config,
                    layoutString: event.layoutString,
                    implementations: event.implementations,
                  });
                  return;
                }
                case 'EXTRACTION_ERROR': {
                  webviewPanel.webview.postMessage({
                    type: 'DISPLAY_ERROR',
                    error: event.message,
                  });
                  return;
                }
              }
            },
          );

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

export const initiateEditor = (
  extensionContext: vscode.ExtensionContext,
  languageClient: TypeSafeLanguageClient,
) => {
  const service = interpret(
    machine.withContext({ extensionContext, languageClient }),
  ).start();
  extensionContext.subscriptions.push({ dispose: () => service.stop() });
};
