import { RequestType, getTsdk } from '@volar/vscode';
import { LanguageClient, TransportKind } from '@volar/vscode/node.js';
import {
  applyPatches,
  getMachineAtIndex,
} from '@xstate/language-server/protocol';
import type { ExtractorDigraphDef, Patch } from '@xstate/ts-project';
import * as vscode from 'vscode';
import {
  ActorRef,
  ExtractEvent,
  Snapshot,
  assertEvent,
  assign,
  fromCallback,
  fromPromise,
  sendTo,
  setup,
} from 'xstate';
import { assertExtendedEvent } from './utils';
import { webviewLogic } from './webview';

type LanguageClientInput = {
  extensionContext: vscode.ExtensionContext;
  tsdk: Awaited<ReturnType<typeof getTsdk>>['tsdk'];
  isServerEnabled: boolean;
};

export type OpenMachineData = {
  uri: string;
  machineIndex: number;
};

export type LanguageClientEvent =
  | { type: 'SERVER_ENABLED_CHANGE' }
  | { type: 'WEBVIEW_CLOSED' }
  | ({ type: 'OPEN_MACHINE'; digraph: ExtractorDigraphDef } & OpenMachineData)
  | ({
      type: 'APPLY_PATCHES';
      patches: Patch[];
      reason: 'undo' | 'redo' | undefined;
    } & OpenMachineData);

export const languageClientMachine = setup({
  types: {} as {
    input: LanguageClientInput;
    context: {
      extensionContext: vscode.ExtensionContext;
      languageClient: LanguageClient;
      patchesToApply: ExtractEvent<LanguageClientEvent, 'APPLY_PATCHES'>[];
      nextPatch: ExtractEvent<LanguageClientEvent, 'APPLY_PATCHES'> | undefined;
    };
    events: LanguageClientEvent;
    children: {
      webview: 'webviewLogic';
    };
  },
  actions: {
    stopLanguageClient: ({ context }) => context.languageClient.stop(),
    updateDigraph: sendTo('webview', ({ event }) => {
      assertEvent(event, 'OPEN_MACHINE');
      return event;
    }),
    applyPatches: ({ context, event }) => {
      assertEvent(event, 'APPLY_PATCHES');
      const { type, ...params } = event;
      context.languageClient
        .sendRequest(applyPatches, params)
        .then((textEdits) => {
          const workspaceEdit = new vscode.WorkspaceEdit();
          for (const textEdit of textEdits) {
            switch (textEdit.type) {
              case 'delete': {
                workspaceEdit.delete(
                  vscode.Uri.parse(params.uri),
                  new vscode.Range(
                    new vscode.Position(
                      textEdit.range.start.line,
                      textEdit.range.start.character,
                    ),
                    new vscode.Position(
                      textEdit.range.end.line,
                      textEdit.range.end.character,
                    ),
                  ),
                );
                break;
              }
              case 'insert': {
                workspaceEdit.insert(
                  vscode.Uri.parse(params.uri),
                  new vscode.Position(
                    textEdit.position.line,
                    textEdit.position.character,
                  ),
                  textEdit.newText,
                );
                break;
              }
              case 'replace': {
                workspaceEdit.replace(
                  vscode.Uri.parse(params.uri),
                  new vscode.Range(
                    new vscode.Position(
                      textEdit.range.start.line,
                      textEdit.range.start.character,
                    ),
                    new vscode.Position(
                      textEdit.range.end.line,
                      textEdit.range.end.character,
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
    },
  },
  actors: {
    listenOnServerEnabledChange: fromCallback(
      ({
        input: { parent },
      }: {
        input: { parent: ActorRef<Snapshot<unknown>, LanguageClientEvent> };
      }) => {
        const disposable = vscode.workspace.onDidChangeConfiguration(
          (event) => {
            if (!event.affectsConfiguration('xstate.server.enabled')) {
              return;
            }
            parent.send({ type: 'SERVER_ENABLED_CHANGE' });
          },
        );
        return () => disposable.dispose();
      },
    ),
    registerCommands: fromCallback(
      ({
        input: { languageClient, parent },
      }: {
        input: {
          languageClient: LanguageClient;
          parent: ActorRef<Snapshot<unknown>, LanguageClientEvent>;
        };
      }) => {
        const disposable = vscode.commands.registerCommand(
          'stately-xstate/edit-machine',
          (uri: string, machineIndex: number) => {
            // TODO: actually use this token to cancel redundant requests
            const tokenSource = new vscode.CancellationTokenSource();
            sendRequest(
              languageClient,
              getMachineAtIndex,
              {
                uri,
                machineIndex,
              },
              tokenSource.token,
            ).then((digraph) => {
              if (!digraph) {
                return;
              }
              parent.send({
                type: 'OPEN_MACHINE',
                uri,
                machineIndex,
                digraph,
              });
            });
          },
        );
        return () => disposable.dispose();
      },
    ),
    startLanguageClient: fromPromise(
      async ({
        input: { languageClient },
      }: {
        input: { languageClient: LanguageClient };
      }) => {
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Window,
            title: 'Starting XState Language Server…',
          },
          async () => {
            await languageClient.start();
          },
        );
      },
    ),
    webviewLogic,
    applyPatches: fromPromise(async ({ input }) => {
      console.log('applying patches');
      const { context, event } = input;
      assertEvent(event, 'APPLY_PATCHES');
      const { type, ...params } = event;
      const textEdits = await context.languageClient.sendRequest(
        applyPatches,
        params,
      );

      const workspaceEdit = new vscode.WorkspaceEdit();
      for (const textEdit of textEdits) {
        switch (textEdit.type) {
          case 'delete': {
            workspaceEdit.delete(
              vscode.Uri.parse(params.uri),
              new vscode.Range(
                new vscode.Position(
                  textEdit.range.start.line,
                  textEdit.range.start.character,
                ),
                new vscode.Position(
                  textEdit.range.end.line,
                  textEdit.range.end.character,
                ),
              ),
            );
            break;
          }
          case 'insert': {
            workspaceEdit.insert(
              vscode.Uri.parse(params.uri),
              new vscode.Position(
                textEdit.position.line,
                textEdit.position.character,
              ),
              textEdit.newText,
            );
            break;
          }
          case 'replace': {
            workspaceEdit.replace(
              vscode.Uri.parse(params.uri),
              new vscode.Range(
                new vscode.Position(
                  textEdit.range.start.line,
                  textEdit.range.start.character,
                ),
                new vscode.Position(
                  textEdit.range.end.line,
                  textEdit.range.end.character,
                ),
              ),
              textEdit.newText,
            );
            break;
          }
        }
      }
      return vscode.workspace.applyEdit(workspaceEdit);
    }),
  },
}).createMachine({
  context: ({ input }) => {
    return {
      extensionContext: input.extensionContext,
      languageClient: new LanguageClient(
        'XState',
        {
          module: input.extensionContext.asAbsolutePath(
            'dist/language-server.js',
          ),
          transport: TransportKind.ipc,
        },
        {
          documentSelector: [{ language: 'typescript' }],
          initializationOptions: {
            typescript: { tsdk: input.tsdk },
          },
        },
      ),
      patchesToApply: [],
      nextPatch: undefined,
    };
  },
  invoke: {
    src: 'listenOnServerEnabledChange',
    input: ({ self }) => ({ parent: self }),
  },
  initial: 'decide_initial_state',
  states: {
    decide_initial_state: {
      always: [
        {
          guard: ({ event }) => {
            const extendedEvent = assertExtendedEvent<
              typeof event,
              { type: 'xstate.init'; input: LanguageClientInput }
            >(event, 'xstate.init');
            return extendedEvent.input.isServerEnabled;
          },
          target: 'enabled',
        },
        'disabled',
      ],
    },
    disabled: {
      on: {
        SERVER_ENABLED_CHANGE: {
          target: 'enabled',
        },
      },
    },
    enabled: {
      initial: 'starting',
      states: {
        starting: {
          invoke: {
            src: 'startLanguageClient',
            input: ({ context }) => ({
              languageClient: context.languageClient,
            }),
            onDone: 'active',
          },
        },
        active: {
          invoke: {
            src: 'registerCommands',
            input: ({ context, self }) => ({
              languageClient: context.languageClient,
              parent: self,
            }),
          },
          initial: 'webviewClosed',
          states: {
            webviewClosed: {
              on: {
                OPEN_MACHINE: 'webviewOpen',
              },
            },
            webviewOpen: {
              invoke: {
                src: 'webviewLogic',
                id: 'webview',
                input: ({ context, event, self }) => {
                  assertEvent(event, 'OPEN_MACHINE');
                  const { type, ...params } = event;
                  return {
                    extensionContext: context.extensionContext,
                    parent: self,
                    ...params,
                  };
                },
              },
              on: {
                WEBVIEW_CLOSED: 'webviewClosed',
                OPEN_MACHINE: {
                  actions: 'updateDigraph',
                },
                APPLY_PATCHES: {
                  actions: assign({
                    patchesToApply: ({ context, event }) => {
                      return context.patchesToApply.concat(event);
                    },
                  }),
                },
              },
              initial: 'appliedPatches',
              states: {
                applyingPatches: {
                  invoke: {
                    src: 'applyPatches',
                    input: ({ context }) => ({
                      context,
                      event: context.nextPatch!,
                    }),
                    onDone: {
                      target: 'appliedPatches',
                    },
                  },
                },
                appliedPatches: {
                  always: {
                    guard: ({ context }) => context.patchesToApply.length > 0,
                    actions: assign(({ context }) => {
                      const nextPatch = context.patchesToApply.shift()!;
                      return {
                        patchesToApply: context.patchesToApply,
                        nextPatch,
                      };
                    }),
                    target: 'applyingPatches',
                  },
                },
              },
            },
          },
        },
      },
      exit: 'stopLanguageClient',
      on: {
        SERVER_ENABLED_CHANGE: {
          target: 'disabled',
        },
      },
    },
  },
});

/**
 * A wrapper function that proxies to the `client.sendRequest`.
 * It's only purpose is to provide better types since `client.sendRequest` has 6 overloads
 * and reports poor error messages partially cause of that.
 *
 * This mitigates the problem by defining 1 focused signature.
 */
function sendRequest<P, R, E>(
  client: LanguageClient,
  request: RequestType<P, R, E>,
  params: P,
  token: vscode.CancellationToken,
): Promise<R> {
  return client.sendRequest(request, params, token);
}
