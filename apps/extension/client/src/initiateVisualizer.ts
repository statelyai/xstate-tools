import { ExtractorMachineConfig } from '@xstate/machine-extractor';
import * as path from 'path';
import * as vscode from 'vscode';
import { MachineConfig } from 'xstate';
import { getWebviewContent } from './getWebviewContent';
import { TypeSafeLanguageClient } from './typeSafeLanguageClient';
import * as typeSafeVsCode from './typeSafeVsCode';
import { VizWebviewMachineEvent } from './vizWebviewScript';

export const initiateVisualizer = (
  context: vscode.ExtensionContext,
  languageClient: TypeSafeLanguageClient,
) => {
  let currentPanel: vscode.WebviewPanel | undefined;
  let lastTokenSource: vscode.CancellationTokenSource | undefined;

  const sendMessage = (event: VizWebviewMachineEvent) => {
    currentPanel?.webview.postMessage(event);
  };

  const startService = (
    config: ExtractorMachineConfig,
    machineIndex: number,
    uri: string,
    guardsToMock: string[],
  ) => {
    languageClient.sendRequest('setDisplayedMachine', {
      uri,
      machineIndex,
    });
    if (currentPanel) {
      currentPanel.reveal(typeSafeVsCode.getViewColumn());

      sendMessage({
        type: 'RECEIVE_SERVICE',
        config,
        guardsToMock,
      });
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        'visualizer',
        'XState Visualizer',
        typeSafeVsCode.getViewColumn(),
        { enableScripts: true, retainContextWhenHidden: true },
      );

      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, 'scripts', 'vizWebview.js'),
      );

      const src = currentPanel.webview.asWebviewUri(onDiskPath);

      currentPanel.webview.html = getWebviewContent(src, 'XState Visualizer');

      sendMessage({
        type: 'RECEIVE_SERVICE',
        config,
        guardsToMock,
      });

      // Handle disposing the current XState Visualizer
      currentPanel.onDidDispose(
        () => {
          languageClient.sendRequest('clearDisplayedMachine', undefined);
          currentPanel = undefined;
        },
        undefined,
        context.subscriptions,
      );
    }
  };

  context.subscriptions.push(
    typeSafeVsCode.registerCommand('stately-xstate.visualize', async () => {
      lastTokenSource?.cancel();
      lastTokenSource = new vscode.CancellationTokenSource();
      try {
        const activeTextEditor = vscode.window.activeTextEditor!;
        const uri = resolveUriToFilePrefix(activeTextEditor.document.uri.path);
        const { config, machineIndex, namedGuards } =
          await languageClient.sendRequest(
            'getMachineAtCursorPosition',
            {
              uri,
              position: {
                line: activeTextEditor.selection.start.line,
                column: activeTextEditor.selection.start.character,
              },
            },
            lastTokenSource.token,
          );
        startService(config, machineIndex, uri, namedGuards);
      } catch {
        vscode.window.showErrorMessage(
          'Could not find a machine at the current cursor.',
        );
      }
    }),
  );

  context.subscriptions.push(
    languageClient.onNotification(
      'displayedMachineUpdated',
      ({ config, namedGuards }) => {
        sendMessage({
          type: 'UPDATE',
          config,
          guardsToMock: namedGuards,
        });
      },
    ),
  );

  context.subscriptions.push(
    typeSafeVsCode.registerCommand(
      'stately-xstate.inspect',
      (uri, machineIndex) => {
        lastTokenSource?.cancel();
        lastTokenSource = new vscode.CancellationTokenSource();
        languageClient
          .sendRequest(
            'getMachineAtIndex',
            { uri, machineIndex },
            lastTokenSource.token,
          )
          .then(({ config, namedGuards }) => {
            startService(config, machineIndex, uri, namedGuards);
          });
      },
    ),
  );

  return {
    currentPanel,
    startService,
  };
};

const resolveUriToFilePrefix = (uri: string) => {
  if (!uri.startsWith('file://')) {
    return `file://${uri}`;
  }
  return uri;
};
