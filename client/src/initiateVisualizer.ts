import * as path from "path";
import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient/node";
import { MachineConfig } from "xstate";
import { Location, parseMachinesFromFile } from "xstate-parser-demo";
import {
  filterOutIgnoredMachines,
  isCursorInPosition,
} from "xstate-vscode-shared";
import { getWebviewContent } from "./getWebviewContent";
import { WebviewMachineEvent } from "./webviewScript";

export const initiateVisualizer = (
  context: vscode.ExtensionContext,
  client: LanguageClient,
) => {
  let currentPanel: vscode.WebviewPanel | undefined = undefined;

  const sendMessage = (event: WebviewMachineEvent) => {
    currentPanel?.webview.postMessage(JSON.stringify(event));
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
        type: "RECEIVE_SERVICE",
        config,
        index: machineIndex,
        uri,
        guardsToMock,
      });
    } else {
      currentPanel = vscode.window.createWebviewPanel(
        "visualizer",
        "XState Visualizer",
        vscode.ViewColumn.Beside,
        { enableScripts: true, retainContextWhenHidden: true },
      );

      const onDiskPath = vscode.Uri.file(
        path.join(context.extensionPath, "client", "scripts", "webview.js"),
      );

      const src = currentPanel.webview.asWebviewUri(onDiskPath);

      currentPanel.webview.html = getWebviewContent(src);

      sendMessage({
        type: "RECEIVE_SERVICE",
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
    vscode.commands.registerCommand("xstate.visualize", () => {
      try {
        const currentSelection = vscode.window.activeTextEditor.selection;

        const currentText = vscode.window.activeTextEditor.document.getText();

        const result = filterOutIgnoredMachines(
          parseMachinesFromFile(currentText),
        );

        let foundIndex: number | null = null;

        const machine = result.machines.find((machine, index) => {
          if (
            machine?.ast?.definition?.node?.loc ||
            machine?.ast?.options?.node?.loc
          ) {
            const isInPosition =
              isCursorInPosition(
                machine?.ast?.definition?.node?.loc,
                currentSelection.start,
              ) ||
              isCursorInPosition(
                machine?.ast?.options?.node?.loc,
                currentSelection.start,
              );

            if (isInPosition) {
              foundIndex = index;
              return true;
            }
          }
          return false;
        });

        if (machine) {
          startService(
            machine.toConfig() as any,
            foundIndex!,
            resolveUriToFilePrefix(
              vscode.window.activeTextEditor.document.uri.path,
            ),
            Object.keys(machine.getAllNamedConds()).filter(Boolean),
          );
        } else {
          vscode.window.showErrorMessage(
            "Could not find a machine at the current cursor.",
          );
        }
      } catch (e) {
        vscode.window.showErrorMessage(
          "Could not find a machine at the current cursor.",
        );
      }
    }),
  );

  client.onReady().then(() => {
    context.subscriptions.push(
      client.onNotification("xstate/update", (event) => {
        sendMessage({
          type: "UPDATE",
          config: event.config,
          index: event.index,
          uri: event.uri,
          guardsToMock: event.guardsToMock,
        });
      }),
    );
  });
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "xstate.inspect",
      async (
        config: MachineConfig<any, any, any>,
        machineIndex: number,
        uri: string,
        guardsToMock: string[],
      ) => {
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
  if (!uri.startsWith("file://")) {
    return `file://${uri}`;
  }
  return uri;
};
