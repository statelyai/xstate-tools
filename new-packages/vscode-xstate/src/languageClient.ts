import { RequestType, getTsdk } from '@volar/vscode';
import { LanguageClient, TransportKind } from '@volar/vscode/node.js';
import { getMachineAtIndex } from '@xstate/language-server/protocol';
import type { ExtractorDigraphDef } from '@xstate/ts-project';
import * as vscode from 'vscode';
import {
  ActorRef,
  Snapshot,
  assertEvent,
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
export type LanguageClientEvent =
  | { type: 'SERVER_ENABLED_CHANGE' }
  | { type: 'WEBVIEW_CLOSED' }
  | { type: 'OPEN_MACHINE'; digraph: ExtractorDigraphDef };

export const languageClientMachine = setup({
  types: {} as {
    input: LanguageClientInput;
    context: {
      extensionContext: vscode.ExtensionContext;
      languageClient: LanguageClient;
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
      return {
        type: 'UPDATE_DIGRAPH',
        digraph: event.digraph,
      };
    }),
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
                  return {
                    extensionContext: context.extensionContext,
                    parent: self,
                    digraph: event.digraph,
                  };
                },
              },
              on: {
                WEBVIEW_CLOSED: 'webviewClosed',
                OPEN_MACHINE: {
                  actions: 'updateDigraph',
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
