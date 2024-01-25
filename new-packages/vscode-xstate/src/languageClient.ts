import { RequestType, getTsdk } from '@volar/vscode';
import { LanguageClient, TransportKind } from '@volar/vscode/node.js';
import { helloRequest } from '@xstate/language-server/protocol';
import * as vscode from 'vscode';
import { ActorRef, Snapshot, fromCallback, fromPromise, setup } from 'xstate';
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
  | { type: 'OPEN_MACHINE' };

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
        input: { languageClient },
      }: {
        input: { languageClient: LanguageClient };
      }) => {
        const disposable = vscode.commands.registerCommand(
          'xstate.hello',
          () => {
            const activeTextEditorUri =
              vscode.window.activeTextEditor?.document.uri.toString();
            sendRequest(languageClient, helloRequest, {
              name: 'Andarist',
              textDocument: activeTextEditorUri
                ? {
                    uri: activeTextEditorUri,
                  }
                : undefined,
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
            // TODO: what about commands executed before we get here?
            src: 'registerCommands',
            input: ({ context }) => ({
              languageClient: context.languageClient,
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
                input: ({ context, self }) => ({
                  extensionContext: context.extensionContext,
                  parent: self,
                }),
              },
              on: {
                WEBVIEW_CLOSED: 'webviewClosed',
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
  client: LanguageClient | undefined,
  request: RequestType<P, R, E>,
  params: P,
): Promise<R> | undefined {
  return client?.sendRequest(request, params);
}
