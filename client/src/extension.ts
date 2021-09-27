/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { MachineConfig } from "xstate";
import { Location, parseMachinesFromFile } from "xstate-parser-demo";
import { getWebviewContent } from "./getWebviewContent";
import { WebviewMachineEvent } from "./webviewScript";
import { filterOutIgnoredMachines } from "xstate-vscode-shared";

let client: LanguageClient;

let currentPanel: vscode.WebviewPanel | undefined = undefined;

const sendMessage = (event: WebviewMachineEvent) => {
  currentPanel?.webview.postMessage(JSON.stringify(event));
};

export function activate(context: vscode.ExtensionContext) {
  // The server is implemented in node
  let serverModule = context.asAbsolutePath(
    path.join("server", "dist", "index.js"),
  );
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging
  let debugOptions = { execArgv: ["--nolazy", "--inspect=6009"] };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  // Options to control the language client
  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "typescript" },
      {
        scheme: "file",
        language: "javascript",
      },
      { scheme: "file", language: "typescriptreact" },
      {
        scheme: "file",
        language: "javascriptreact",
      },
    ],
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "xstateLanguageServer",
    "XState",
    serverOptions,
    clientOptions,
  );

  client.start();

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
            Object.keys(machine.getAllNamedConds()),
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
  }),
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
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

const isCursorInPosition = (
  nodeSourceLocation: Location,
  cursorPosition: vscode.Position,
) => {
  if (!nodeSourceLocation) return;
  const isOnSameLine =
    nodeSourceLocation.start.line - 1 === cursorPosition.line;

  const isWithinChars =
    cursorPosition.character >= nodeSourceLocation.start.column &&
    cursorPosition.character <= nodeSourceLocation.end.column;
  if (isOnSameLine) {
    return isWithinChars;
  }

  const isWithinLines =
    cursorPosition.line >= nodeSourceLocation.start.line - 1 &&
    cursorPosition.line <= nodeSourceLocation.end.line;

  return isWithinLines;
};

const resolveUriToFilePrefix = (uri: string) => {
  if (!uri.startsWith("file://")) {
    return `file://${uri}`;
  }
  return uri;
};
