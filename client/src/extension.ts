/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as path from "path";
import * as fs from "fs";
import { TextEncoder } from "util";
import * as vscode from "vscode";

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import { MachineConfig } from "xstate";
import {
  IntrospectMachineResult,
  makeInterfaceFromIntrospectionResult,
} from "xstate-vscode-shared";
import { getWebviewContent } from "./getWebviewContent";
import { WebviewMachineEvent } from "./webviewScript";
import { createHash, createHmac } from "crypto";

const createContentHash = (str: string): Promise<string> => {
  return new Promise((resolve) => {
    const hash = createHash("sha256");

    hash.on("readable", () => {
      // Only one element is going to be produced by the
      // hash stream.
      const data = hash.read();
      resolve(data.toString("hex").slice(0, 8));
    });

    hash.write(str);
    hash.end();
  });
};

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
    "XState (Demo)",
    serverOptions,
    clientOptions,
  );

  client.start();

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "xstate.create-typed-options",
      async (introspectionResult: IntrospectMachineResult, uri: string) => {
        const content = makeInterfaceFromIntrospectionResult(
          introspectionResult,
          // Remove all newlines
        ).replace(/\r?\n|\r/g, "");

        const newUri = await vscode.window.showSaveDialog({
          defaultUri: vscode.Uri.file(
            uri.replace(/\.([j,t])sx?$/, ".types.ts"),
          ),
          title: "Save type definitions",
        });

        await vscode.workspace.fs.writeFile(
          newUri,
          new TextEncoder().encode(content),
        );
        await vscode.window.showTextDocument(newUri);
      },
    ),
  );

  client.onReady().then(() => {
    context.subscriptions.push(
      client.onNotification("xstate/update", async (event) => {
        if (event.machines.length === 0) return;

        event.machines.forEach((machine) => {
          sendMessage({
            type: "UPDATE",
            config: machine.config,
            index: machine.index,
            uri: event.uri,
            guardsToMock: machine.guardsToMock,
          });
        });

        const uri = event.uri;

        const newUri = vscode.Uri.file(
          uri.replace(/\.([j,t])sx?$/, ".typegen.ts"),
        );

        const id = await createContentHash(
          vscode.workspace.asRelativePath(uri),
        );

        fs.writeFileSync(
          path.resolve(newUri.path).slice(6),
          `/// <reference types="xstate" />
        import { MachineConfig, EventObject } from 'xstate';

        declare module 'xstate' {
          export interface GeneratedMachineDefinitions<TContext, TEvent extends EventObject> {
            ${event.machines
              .map((_, index) => {
                return `'${id}_${index}': {
                  config: MachineConfig<TContext, any, TEvent> & { types?: '${id}_${index}'; };
                  options: {};
                  machine: unknown;
                }`;
              })
              .join("\n")}
          }
        }
        
        export type TypegenIds = {
          ${event.machines
            .map((_, index) => {
              return `${index}: '${id}_${index}'`;
            })
            .join("\n")}
        };
        
        `,
        );

        // await vscode.workspace.fs.writeFile(
        //   newUri,
        //   new TextEncoder().encode(``),
        // );
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
              path.join(
                context.extensionPath,
                "client",
                "scripts",
                "webview.js",
              ),
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
