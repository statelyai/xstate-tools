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
import { createMachine, MachineConfig } from "xstate";
import {
  getRangeFromSourceLocation,
  introspectMachine,
  IntrospectMachineResult,
  makeInterfaceFromIntrospectionResult,
  XStateUpdateEvent,
} from "xstate-vscode-shared";
import { getWebviewContent } from "./getWebviewContent";
import { WebviewMachineEvent } from "./webviewScript";
import { createHash, createHmac } from "crypto";
import { parseMachinesFromFile } from "xstate-parser-demo";

let client: LanguageClient;

let currentPanel: vscode.WebviewPanel | undefined = undefined;

let latestXStateUpdateEventTracker: Record<string, XStateUpdateEvent> = {};

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
      vscode.workspace.onWillSaveTextDocument(async (event) => {
        const result = parseMachinesFromFile(event.document.getText());

        if (result.machines.length > 0) {
          event.waitUntil(
            new Promise((resolve) => {
              const fileEdits: vscode.TextEdit[] = [];

              const relativePath = removeExtension(
                path.basename(event.document.uri.path),
              );
              result.machines
                .filter((machine) => Boolean(machine.ast.definition.types.node))
                .forEach((machine, index) => {
                  const position = getRangeFromSourceLocation(
                    machine.ast.definition.types.node.loc,
                  );

                  console.log(machine);

                  fileEdits.push(
                    new vscode.TextEdit(
                      new vscode.Range(
                        new vscode.Position(
                          position.start.line,
                          position.start.character,
                        ),
                        new vscode.Position(
                          position.end.line,
                          position.end.character,
                        ),
                      ),
                      `{} as import('./${relativePath}.typegen').Typegen[${index}]`,
                    ),
                  );
                });

              resolve(fileEdits);
            }),
          );
        }
      }),
      client.onNotification(
        "xstate/update",
        async (event: XStateUpdateEvent) => {
          if (event.machines.length === 0) return;

          const prettyPath = vscode.Uri.file(event.uri).path.slice(8);

          latestXStateUpdateEventTracker[prettyPath] = event;

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

          if (
            event.machines.filter((machine) => machine.hasTypesNode).length > 0
          ) {
            fs.writeFileSync(
              path.resolve(newUri.path).slice(6),
              getTypegenOutput(event),
            );
          } else {
            fs.unlinkSync(path.resolve(newUri.path).slice(6));
          }

          // await vscode.workspace.fs.writeFile(
          //   newUri,
          //   new TextEncoder().encode(``),
          // );
        },
      ),
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

const getTypegenOutput = (event: XStateUpdateEvent) => {
  return `
  export type Typegen = [
    ${event.machines
      .filter((machine) => machine.hasTypesNode)
      .map((machine) => {
        try {
          const guards: Record<string, () => boolean> = {};

          machine.guardsToMock.forEach((guard) => {
            guards[guard] = () => true;
          });

          machine.config.context = {};

          const createdMachine = createMachine(machine.config || {}, {
            guards,
          });

          const introspectResult = introspectMachine(createdMachine as any);

          const requiredActions = introspectResult.actions.lines
            .filter((action) => !machine.actionsInOptions.includes(action.name))
            .map((action) => `'${action.name}'`)
            .join(" | ");

          const requiredServices = introspectResult.services.lines
            .filter(
              (service) => !machine.servicesInOptions.includes(service.name),
            )
            .map((service) => `'${service.name}'`)
            .join(" | ");

          const requiredGuards = introspectResult.guards.lines
            .filter((guard) => !machine.guardsInOptions.includes(guard.name))
            .map((guard) => `'${guard.name}'`)
            .join(" | ");

          const requiredDelays = introspectResult.delays.lines
            .filter((delay) => !machine.delaysInOptions.includes(delay.name))
            .map((delay) => `'${delay.name}'`)
            .join(" | ");

          const tags = machine.tags.map((tag) => `'${tag}'`).join(" | ");

          const optionsRequired = Boolean(
            requiredActions ||
              requiredGuards ||
              requiredDelays ||
              requiredServices,
          );

          const matchesStates = introspectResult.stateMatches
            .map((elem) => `'${elem}'`)
            .join(" | ");

          return `{
            __generated: 1;
            optionsRequired: ${optionsRequired ? 1 : 0};
            eventsCausingActions: {
              ${introspectResult.actions.lines
                .map((line) => {
                  return `'${line.name}': ${
                    line.events.map((event) => `'${event}'`).join(" | ") ||
                    "string"
                  };`;
                })
                .join("\n")}
            };
            ${requiredActions ? `requiredActions: ${requiredActions};` : ""}
            ${requiredServices ? `requiredServices: ${requiredServices};` : ""}
            ${requiredGuards ? `requiredGuards: ${requiredGuards};` : ""}
            ${requiredDelays ? `requiredDelays: ${requiredDelays};` : ""}
            eventsCausingServices: {
              ${introspectResult.services.lines
                .map((line) => {
                  return `'${line.name}': ${
                    line.events.map((event) => `'${event}'`).join(" | ") ||
                    "string"
                  };`;
                })
                .join("\n")}
            };
            eventsCausingGuards: {
              ${introspectResult.guards.lines
                .map((line) => {
                  return `'${line.name}': ${
                    line.events.map((event) => `'${event}'`).join(" | ") ||
                    "string"
                  };`;
                })
                .join("\n")}
            };
            allDelays: {
              ${introspectResult.delays.lines
                .map((line) => {
                  return `'${line.name}': true;`;
                })
                .join("\n")}
            };
            matchesStates: ${matchesStates || "undefined"};
            ${tags ? `tags: ${tags};` : ""}
          }`;
        } catch (e) {}
        return `{}`;
      })
      .join(",\n")}
  ];
  `;
};

const removeExtension = (input: string) => {
  return input.substr(0, input.lastIndexOf("."));
};
