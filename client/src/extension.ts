/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as fs from "fs";
import * as path from "path";
import * as prettier from "prettier";
import { promisify } from "util";
import * as vscode from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";
import {
  assign,
  createMachine,
  interpret,
  MachineConfig,
  StateNodeConfig,
} from "xstate";
import { Location, parseMachinesFromFile } from "xstate-parser-demo";
import { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";
import {
  filterOutIgnoredMachines,
  getRangeFromSourceLocation,
  introspectMachine,
  XStateUpdateEvent,
} from "xstate-vscode-shared";
import { choose } from "xstate/lib/actions";
import { getWebviewContent } from "./getWebviewContent";
import { WebviewMachineEvent } from "./webviewScript";

let client: LanguageClient;

let currentPanel: vscode.WebviewPanel | undefined = undefined;

const sendMessage = (event: WebviewMachineEvent) => {
  currentPanel?.webview.postMessage(JSON.stringify(event));
};

const throttledTypegenCreationMachine = createMachine<
  {
    eventMap: Record<string, XStateUpdateEvent>;
  },
  { type: "RECEIVE_NEW_EVENT"; event: XStateUpdateEvent }
>(
  {
    initial: "idle",
    context: {
      eventMap: {},
    },
    preserveActionOrder: true,
    on: {
      RECEIVE_NEW_EVENT: {
        target: ".throttling",
        internal: false,
        actions: assign((context, event) => {
          return {
            eventMap: {
              ...context.eventMap,
              [event.event.uri]: event.event,
            },
          };
        }),
      },
    },
    states: {
      idle: {
        entry: ["executeAction", "clearActions"],
      },
      throttling: {
        after: {
          500: "idle",
        },
      },
    },
  },
  {
    actions: {
      executeAction: async (context) => {
        await Promise.all([
          Object.entries(context.eventMap).map(async ([, event]) => {
            const uri = event.uri;

            const newUri = vscode.Uri.file(
              uri.replace(/\.([j,t])sx?$/, ".typegen.ts"),
            );

            const pathToSave = path.resolve(newUri.path).slice(6);

            const prettierConfig = await prettier.resolveConfig(pathToSave);

            if (
              event.machines.filter((machine) => machine.hasTypesNode).length >
              0
            ) {
              await promisify(fs.writeFile)(
                pathToSave,
                prettier.format(getTypegenOutput(event), {
                  ...prettierConfig,
                  parser: "typescript",
                }),
              );
            } else {
              await promisify(fs.unlink)(path.resolve(newUri.path).slice(6));
            }
          }),
        ]);
      },
      clearActions: assign((context) => {
        return {
          eventMap: {},
        };
      }),
    },
  },
);

const typegenService = interpret(throttledTypegenCreationMachine).start();

const typeArgumentLogicMachine = (
  machine: MachineParseResult,
  pushTextEdit: (fileEdit: vscode.TextEdit) => void,
  getRawText: (start: number, end: number) => string,
  relativePath: string,
  machineIndex: number,
) => {
  const typeArguments = machine?.ast?.typeArguments?.node;
  const typeArgumentsRaw: string[] =
    typeArguments?.params?.map((param) => {
      return getRawText(param.start, param.end);
    }) || [];

  const calleeRaw = getRawText(
    machine.ast?.callee?.start,
    machine.ast?.callee?.end,
  );
  return createMachine(
    {
      initial: "init",
      states: {
        init: {
          always: [
            {
              cond: "wantsTypegen",
              target: "wantsTypegen",
            },
            {
              target: "doesNotWantTypegen",
            },
          ],
        },
        wantsTypegen: {
          initial: "init",
          states: {
            init: {
              always: [
                {
                  cond: "isMemberExpression",
                  target: "isMemberExpression",
                },
                {
                  target: "isNotMemberExpression",
                },
              ],
            },
            isMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasAtLeastOneType",
                      target: "hasTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasTypes: {
                  entry: ["updateSingleTypeArgument"],
                  type: "final",
                },
                hasNoTypes: {
                  entry: ["addSingleTypeArgument"],
                  type: "final",
                },
              },
            },
            isNotMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasFourTypes",
                      target: "hasFourTypes",
                    },
                    {
                      cond: "hasAtLeastOneType",
                      target: "hasLessThanFourTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasNoTypes: {
                  entry: ["appendFourTypes"],
                  type: "final",
                },
                hasLessThanFourTypes: {
                  entry: ["overwriteTypesWithFourTypes"],
                  type: "final",
                },
                hasFourTypes: {
                  entry: ["overwriteFinalType"],
                  type: "final",
                },
              },
            },
          },
        },
        doesNotWantTypegen: {
          initial: "init",
          states: {
            init: {
              always: [
                {
                  cond: "isMemberExpression",
                  target: "isMemberExpression",
                },
                {
                  target: "isNotMemberExpression",
                },
              ],
            },
            isMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasAtLeastOneType",
                      target: "hasTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasTypes: {
                  entry: "removeTypesArgument",
                  type: "final",
                },
                hasNoTypes: {
                  type: "final",
                },
              },
            },
            isNotMemberExpression: {
              initial: "init",
              states: {
                init: {
                  always: [
                    {
                      cond: "hasFourTypes",
                      target: "hasTypes",
                    },
                    {
                      target: "hasNoTypes",
                    },
                  ],
                },
                hasNoTypes: {
                  type: "final",
                },
                hasTypes: {
                  entry: [
                    choose([
                      {
                        cond: "areFirstThreeGenericsDefaults",
                        actions: ["removeTypesArgument"],
                      },
                      {
                        actions: "removeFinalTypeArgument",
                      },
                    ]),
                  ],
                  type: "final",
                },
              },
            },
          },
        },
      },
    },
    {
      guards: {
        wantsTypegen: () => Boolean(machine.ast?.definition?.tsTypes?.value),
        isMemberExpression: () => Boolean(machine?.ast?.isMemberExpression),
        hasAtLeastOneType: () => (typeArguments?.params.length || 0) > 0,
        hasFourTypes: () => typeArguments?.params.length === 4,
        areFirstThreeGenericsDefaults: () => {
          return (
            typeArgumentsRaw[0].trim() === "unknown" &&
            typeArgumentsRaw[1].trim() === "{ type: string }" &&
            typeArgumentsRaw[2].trim() === "any"
          );
        },
      },
      actions: {
        overwriteFinalType: () => {
          const position = getRangeFromSourceLocation(
            typeArguments.params[3].loc,
          );

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `import('./${relativePath}.typegen').Typegen${machineIndex}`,
            ),
          );
        },
        removeFinalTypeArgument: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `<${typeArgumentsRaw.slice(0, -1).join(", ")}>`,
            ),
          );
        },
        updateSingleTypeArgument: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `<import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
        appendFourTypes: () => {
          const position = getRangeFromSourceLocation(machine.ast.callee.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `${calleeRaw}<unknown, { type: string }, any, import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
        overwriteTypesWithFourTypes: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);

          const withDefaults = addDefaultsToTypeArguments(typeArgumentsRaw);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `<${withDefaults
                .slice(0, 3)
                .join(
                  ", ",
                )}, import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
        removeTypesArgument: () => {
          const position = getRangeFromSourceLocation(typeArguments.loc);
          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              ``,
            ),
          );
        },
        addSingleTypeArgument: () => {
          const position = getRangeFromSourceLocation(machine.ast.callee.loc);

          pushTextEdit(
            new vscode.TextEdit(
              new vscode.Range(
                new vscode.Position(
                  position.start.line,
                  position.start.character,
                ),
                new vscode.Position(position.end.line, position.end.character),
              ),
              `${calleeRaw}<import('./${relativePath}.typegen').Typegen${machineIndex}>`,
            ),
          );
        },
      },
    },
  );
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
      vscode.workspace.onWillSaveTextDocument(async (event) => {
        const text = event.document.getText();
        const result = parseMachinesFromFile(text);

        if (result.machines.length > 0) {
          event.waitUntil(
            new Promise((resolve) => {
              const fileEdits: vscode.TextEdit[] = [];

              const relativePath = removeExtension(
                path.basename(event.document.uri.path),
              );

              let machineIndex = 0;

              result.machines.forEach((machine, index) => {
                const service = interpret(
                  typeArgumentLogicMachine(
                    machine,
                    (textEdit) => fileEdits.push(textEdit),
                    (start, end) => text.slice(start, end),
                    relativePath,
                    machineIndex,
                  ),
                ).start();
                service.stop();

                if (machine.ast?.definition?.tsTypes?.value) {
                  machineIndex++;
                }
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

          event.machines.forEach((machine) => {
            sendMessage({
              type: "UPDATE",
              config: machine.config,
              index: machine.index,
              uri: event.uri,
              guardsToMock: machine.guardsToMock,
            });
          });

          typegenService.send({
            type: "RECEIVE_NEW_EVENT",
            event,
          });
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

const getTypegenOutput = (event: XStateUpdateEvent) => {
  return `
  // This file was automatically generated. Edits will be overwritten

  ${event.machines
    .filter((machine) => machine.hasTypesNode)
    .map((machine, index) => {
      try {
        const guards: Record<string, () => boolean> = {};

        machine.guardsToMock.forEach((guard) => {
          guards[guard] = () => true;
        });

        machine.config.context = {};

        modifyInvokesRecursively(machine.config);

        // xstate-ignore-next-line
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

        const matchesStates = introspectResult.stateMatches
          .map((elem) => `'${elem}'`)
          .join(" | ");

        const internalEvents = collectInternalEvents([
          introspectResult.actions.lines,
          introspectResult.services.lines,
          introspectResult.guards.lines,
          introspectResult.delays.lines,
        ]);

        machine.allServices.forEach((service) => {
          internalEvents.add(
            `'done.invoke.${service}': { type: 'done.invoke.${service}'; data: unknown; __tip: "Provide an event of type { type: '${event}'; data: any } to strongly type this" };`,
          );
          internalEvents.add(
            `'error.platform.${service}': { type: 'error.platform.${service}'; data: unknown; };`,
          );
        });

        return `export interface Typegen${index} {
          '@@xstate/typegen': true;
          eventsCausingActions: {
            ${displayEventsCausing(introspectResult.actions.lines)}
          };
          internalEvents: {
            ${Array.from(internalEvents).join("\n")}
          };
          invokeSrcNameMap: {
            ${introspectResult.services.lines
              .map((line) => {
                return `'${line.name}': 'done.invoke.${line.name}'`;
              })
              .join("\n")}
          }
          missingImplementations: {
            ${`actions: ${requiredActions || "never"};`}
            ${`services: ${requiredServices || "never"};`}
            ${`guards: ${requiredGuards || "never"};`}
            ${`delays: ${requiredDelays || "never"};`}
          }
          eventsCausingServices: {
            ${displayEventsCausing(introspectResult.services.lines)}
          };
          eventsCausingGuards: {
            ${displayEventsCausing(introspectResult.guards.lines)}
          };
          eventsCausingDelays: {
            ${displayEventsCausing(introspectResult.delays.lines)}
          };
          matchesStates: ${matchesStates || "undefined"};
          tags: ${tags || "never"};
        }`;
      } catch (e) {
        console.log(e);
      }
      return `export interface Typegen${index} {
        // An error occured, so we couldn't generate the TS
        '@@xstate/typegen': false;
      }`;
    })
    .join(",\n")}
  `;
};

const removeExtension = (input: string) => {
  return input.substr(0, input.lastIndexOf("."));
};

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

const inlineInvocationName = /done\.invoke\..{0,}:invocation\[.{0,}\]/;

const collectInternalEvents = (lineArrays: { events: string[] }[][]) => {
  const internalEvents = new Set<string>();

  lineArrays.forEach((lines) => {
    lines.forEach((line) => {
      line.events.forEach((event) => {
        if (inlineInvocationName.test(event)) {
          internalEvents.add(
            `'${event}': { type: '${event}'; data: unknown; __tip: "Give this service a name and move it into the machine options to strongly type it" };`,
          );
        } else if (event.startsWith("done.invoke")) {
          internalEvents.add(
            `'${event}': { type: '${event}'; data: unknown; __tip: "Provide an event of type { type: '${event}'; data: any } to strongly type this" };`,
          );
        } else if (event.startsWith("xstate.") || event === "") {
          internalEvents.add(`'${event}': { type: '${event}' };`);
        } else if (event.startsWith("error.platform")) {
          internalEvents.add(
            `'${event}': { type: '${event}'; data: unknown; };`,
          );
        }
      });
    });
  });

  return internalEvents;
};

const resolveUriToFilePrefix = (uri: string) => {
  if (!uri.startsWith("file://")) {
    return `file://${uri}`;
  }
  return uri;
};

const displayEventsCausing = (lines: { name: string; events: string[] }[]) => {
  return lines
    .map((line) => {
      return `'${line.name}': ${
        unique(
          line.events.map((event) => {
            return event;
          }),
        )
          .map((event) => {
            return `'${event}'`;
          })
          .join(" | ") || "string"
      };`;
    })
    .join("\n");
};

const unique = <T>(array: T[]) => {
  return Array.from(new Set(array));
};

const modifyInvokesRecursively = (state: StateNodeConfig<any, any, any>) => {
  if (Array.isArray(state.invoke)) {
    state.invoke.forEach((invoke) => {
      if ("src" in invoke && invoke.src === "anonymous") {
        invoke.src = () => () => {};
      }
    });
  } else if (
    state.invoke &&
    "src" in state.invoke &&
    state.invoke.src === "anonymous"
  ) {
    state.invoke.src = () => () => {};
  }

  Object.values(state.states || {}).forEach(modifyInvokesRecursively);
};

const addDefaultsToTypeArguments = (typeArguments: string[]) => {
  const newTypeArguments = [...typeArguments];

  if (newTypeArguments.length === 0) {
    newTypeArguments.push("unknown", `{ type: string }`, `any`);
  } else if (newTypeArguments.length === 1) {
    newTypeArguments.push(`{ type: string }`, `any`);
  } else if (newTypeArguments.length === 2) {
    newTypeArguments.push(`any`);
  }

  return newTypeArguments;
};
