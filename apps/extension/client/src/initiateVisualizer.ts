import { parseMachinesFromFile } from '@xstate/machine-extractor';
import {
  filterOutIgnoredMachines,
  getSetOfNames,
  isCursorInPosition,
  XStateUpdateEvent,
} from '@xstate/tools-shared';
import * as path from 'path';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient/node';
import { MachineConfig } from 'xstate';
import { getWebviewContent } from './getWebviewContent';
import * as typeSafeVsCode from './typeSafeVsCode';
import { VizWebviewMachineEvent } from './vizWebviewScript';

export const initiateVisualizer = (
  context: vscode.ExtensionContext,
  client: LanguageClient,
  registerXStateUpdateListener: (
    listener: (event: XStateUpdateEvent) => void,
  ) => vscode.Disposable,
) => {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const sendMessage = (event: VizWebviewMachineEvent) => {
    currentPanel?.webview.postMessage(event);
  };

  const startService = (
    config: MachineConfig<any, any, any>,
    machineIndex: number,
    uri: string,
    guardsToMock: string[],
  ) => {
    if (currentPanel) {
      currentPanel.reveal(vscode.ViewColumn.Beside);

      sendMessage({
        type: 'RECEIVE_SERVICE',
        config,
        index: machineIndex,
        uri,
        guardsToMock,
      });
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        'visualizer',
        'XState Visualizer',
        vscode.ViewColumn.Beside,
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
        index: machineIndex,
        uri,
        guardsToMock,
      });

      // Handle disposing the current XState Visualizer
      currentPanel.onDidDispose(
        () => {
          currentPanel = undefined;
        },
        undefined,
        context.subscriptions,
      );
    }
  };

  context.subscriptions.push(
    typeSafeVsCode.registerCommand('stately-xstate.visualize', () => {
      try {
        const activeTextEditor = vscode.window.activeTextEditor!;
        const currentSelection = activeTextEditor.selection;
        const currentText = activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText),
        );

        const foundIndex = result.machines.findIndex((machine, index) => {
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

        if (foundIndex !== -1) {
          const machine = result.machines[foundIndex];
          startService(
            machine.toConfig() as any,
            foundIndex!,
            resolveUriToFilePrefix(
              vscode.window.activeTextEditor!.document.uri.path,
            ),
            Array.from(getSetOfNames(machine.getAllConds(['named']))),
          );
        } else {
          vscode.window.showErrorMessage(
            'Could not find a machine at the current cursor.',
          );
        }
      } catch (e) {
        vscode.window.showErrorMessage(
          'Could not find a machine at the current cursor.',
        );
      }
    }),
  );

  context.subscriptions.push(
    registerXStateUpdateListener((event) => {
      event.machines.forEach((machine, index) => {
        sendMessage({
          type: 'UPDATE',
          config: machine.config,
          index,
          uri: event.uri,
          guardsToMock: machine.namedGuards,
        });
      });
    }),
  );
  context.subscriptions.push(
    typeSafeVsCode.registerCommand(
      'stately-xstate.inspect',
      (config, machineIndex, uri, guardsToMock) => {
        startService(config, machineIndex, uri, guardsToMock);
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
