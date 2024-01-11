import { getTsdk } from '@volar/vscode';
import { LanguageClient, TransportKind } from '@volar/vscode/node.js';
import { helloRequest } from '@xstate/language-server/protocol';
import * as vscode from 'vscode';
import { RequestType } from 'vscode-languageserver-protocol';

let client: LanguageClient | undefined;
let disposable: vscode.Disposable | undefined;

export async function activate(context: vscode.ExtensionContext) {
  const { tsdk } = await getTsdk(context);

  client = new LanguageClient(
    'XState',
    {
      module: context.asAbsolutePath('dist/language-server.js'),
      transport: TransportKind.ipc,
    },
    {
      documentSelector: [{ language: 'typescript' }],
      initializationOptions: {
        typescript: { tsdk },
      },
    },
  );

  tryRestartServer(context);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('xstate.server.enable')) {
        tryRestartServer(context);
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('xstate.hello', () => {
      const activeTextEditorUri =
        vscode.window.activeTextEditor?.document.uri.toString();
      sendRequest(helloRequest, {
        name: 'Andarist',
        textDocument: activeTextEditorUri
          ? {
              uri: activeTextEditorUri,
            }
          : undefined,
      });
    }),
  );
}

export async function deactivate() {
  await stopServer();
}

async function startServer(_: vscode.ExtensionContext) {
  const currentClient = client;
  if (!currentClient) {
    return;
  }
  if (currentClient.needsStart()) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'Starting XState Language Server…',
      },
      async () => {
        await currentClient.start();
        // this `disposable` acts as a placeholder in case some extra cleanup has to be done here in the future
        disposable = new vscode.Disposable(() => {});
      },
    );
  }
}

async function stopServer() {
  const currentClient = client;
  if (!currentClient) {
    return;
  }
  if (currentClient.needsStop()) {
    disposable?.dispose();

    await currentClient.stop();
  }
}

async function tryRestartServer(context: vscode.ExtensionContext) {
  await stopServer();
  if (vscode.workspace.getConfiguration('xstate').get('server.enable')) {
    await startServer(context);
  }
}

/**
 * A wrapper function that proxies to the `client.sendRequest`.
 * It's only purpose is to provide better types since `client.sendRequest` has 6 overloads
 * and reports poor error messages partially cause of that.
 *
 * This mitigates the problem by defining 1 focused signature.
 */
function sendRequest<P, R, E>(
  request: RequestType<P, R, E>,
  params: P,
): Promise<R> | undefined {
  const currentClient = client;
  if (!currentClient) {
    return;
  }
  return currentClient.sendRequest(request, params);
}
