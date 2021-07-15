/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Diagnostic,
  DiagnosticSeverity,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  Position,
  ProposedFeatures,
  Range,
  TextDocumentIdentifier,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind,
} from "vscode-languageserver/node";
import {
  assign,
  ConditionPredicate,
  createMachine,
  interpret,
  StateMachine,
} from "xstate";
import {
  Location,
  MachineParseResult,
  MachineParseResultState,
  MachineParseResultTarget,
  parseMachinesFromFile,
} from "xstate-parser-demo";
import { getTransitionsFromNode } from "./getTransitionsFromNode";
import {
  introspectMachine,
  IntrospectMachineResult,
} from "./introspectMachine";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
      // documentSymbolProvider: {
      //   label: "XState",
      // },
      declarationProvider: {
        documentSelector: [
          "typescript",
          "typescriptreact",
          "javascript",
          "javascriptreact",
        ],
      },
      definitionProvider: true,
      referencesProvider: true,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
      codeLensProvider: {
        resolveProvider: true,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

connection.onInitialized(() => {
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined,
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

// The example settings
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

type DocumentValidationsResult = MachineParseResult & {
  machine?: StateMachine<any, any, any>;
  introspectionResult?: IntrospectMachineResult;
};

const documentValidationsCache: Map<string, DocumentValidationsResult[]> =
  new Map();

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <ExampleSettings>(
      (change.settings.languageServerExample || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "languageServerExample",
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

const getReferences = (params: {
  textDocument: TextDocumentIdentifier;
  position: Position;
}) => {
  const machinesParseResult = documentValidationsCache.get(
    params.textDocument.uri,
  );

  if (!machinesParseResult) {
    return [];
  }

  const cursorHover = getCursorHoverType(machinesParseResult, params.position);

  try {
    if (cursorHover?.type === "TARGET") {
      const fullMachine = createMachine(cursorHover.machine.config);

      const state = fullMachine.getStateNodeByPath(cursorHover.state.path);

      // @ts-ignore
      const targetStates: { id: string }[] = state.resolveTarget([
        cursorHover.target.target,
      ]);

      // connection.console.log(JSON.stringify(targetStates, null, 2));

      if (!targetStates) {
        return [];
      }

      const resolvedTargetState = state.getStateNodeById(targetStates[0].id);

      const node = cursorHover.machine.statesMeta.find((stateMeta) => {
        return stateMeta.path.join() === resolvedTargetState.path.join();
      });

      if (!node) {
        return [];
      }

      return [
        {
          uri: params.textDocument.uri,
          range: getRangeFromLocation(node.location),
        },
      ];
    }
    if (cursorHover?.type === "INITIAL") {
      const fullMachine = createMachine(cursorHover.machine.config);

      const state = fullMachine.getStateNodeByPath(cursorHover.state.path);

      const targetState = state.states[cursorHover.target.target];

      if (!targetState) {
        return [];
      }

      const node = cursorHover.machine.statesMeta.find((stateMeta) => {
        return stateMeta.path.join() === targetState.path.join();
      });

      if (!node) {
        return [];
      }

      return [
        {
          uri: params.textDocument.uri,
          range: getRangeFromLocation(node.location),
        },
      ];
    }
  } catch (e) {}

  return [];
};

connection.onReferences((params) => {
  return getReferences(params);
});

connection.onDefinition((params) => {
  return getReferences(params);
});

connection.onCodeLens((params) => {
  const machinesParseResult = documentValidationsCache.get(
    params.textDocument.uri,
  );

  if (!machinesParseResult) {
    return [];
  }
  return machinesParseResult.flatMap((machine) => {
    const firstState = machine.statesMeta[0];
    return {
      range: getRangeFromLocation(firstState.location),
      command: {
        title: "Create Typed Options",
        command: "xstate.create-typed-options",
        arguments: [machine.introspectionResult],
      },
    };
  });
});

const getRangeFromLocation = (location: Location): Range => {
  return {
    start: {
      character: location.start.column,
      line: location.start.line - 1,
    },
    end: {
      character: location.end.column,
      line: location.end.line - 1,
    },
  };
};

async function validateDocument(textDocument: TextDocument): Promise<void> {
  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();

  const diagnostics: Diagnostic[] = [];

  try {
    const machines: DocumentValidationsResult[] = parseMachinesFromFile(
      text,
    ).map((rest) => {
      try {
        const machine = createMachine(rest.config);
        const introspectionResult = introspectMachine(machine);
        return {
          ...rest,
          machine,
          introspectionResult,
        };
      } catch (e) {
        return {
          ...rest,
        };
      }
    });
    documentValidationsCache.set(textDocument.uri, machines);

    machines.forEach((machine) => {
      try {
        const guards: Record<string, ConditionPredicate<any, any>> = {};
        machine.introspectionResult?.guards.lines.forEach((cond) => {
          guards[cond.name] = () => true;
        });
        const createdMachine = createMachine(machine.config, {
          guards,
        });

        createdMachine.transition(createdMachine.initialState, {});
      } catch (e) {
        let range: Range = {
          start: textDocument.positionAt(machine.node.start || 0),
          end: textDocument.positionAt(machine.node.end || 0),
        };
        if (
          e.message.includes("Invalid transition definition for state node")
        ) {
          const index = (e.message as string).indexOf("Child state");

          const stateId = e.message.slice(
            "Invalid transition definition for state node ".length + 1,
            index - 3,
          );

          `Invalid transition definition for state node '(machine).idle': Child state 'awdawd' does not exist on '(machine)'`;

          const itemToFind = "Child state '";

          const targetValue = e.message.slice(
            e.message.indexOf(itemToFind) + itemToFind.length,
            e.message.indexOf("' does not exist on '"),
          );

          const [, ...path] = stateId.split(".");

          const parsedTarget = machine.statesMeta
            .find((state) => state.path.join() === path.join())
            ?.targets.find((target) => {
              return target.target === targetValue;
            });

          if (parsedTarget) {
            range = {
              end: textDocument.positionAt(
                parsedTarget.location.end.absoluteChar,
              ),
              start: textDocument.positionAt(
                parsedTarget.location.start.absoluteChar,
              ),
            };
          }
        }
        if (e.message.includes("Initial state")) {
          `Initial state 'awesom' not found on '(machine)'`;
          const index = (e.message as string).indexOf("not found on '");
          const stateId = e.message.slice(index, index - 1);

          const [, ...path] = stateId.split(".");

          const parsedState = machine.statesMeta.find(
            (state) => state.path.join() === path.join(),
          );

          if (parsedState?.initial) {
            range = {
              end: textDocument.positionAt(
                parsedState.initial.location.end.absoluteChar,
              ),
              start: textDocument.positionAt(
                parsedState.initial.location.start.absoluteChar,
              ),
            };
          }
        }
        diagnostics.push({
          message: e.message,
          range,
          severity: DiagnosticSeverity.Error,
        });
      }
    });
  } catch (e) {
    diagnostics.push({
      message: `Could not parse the machines in this file.`,
      range: {
        start: textDocument.positionAt(0),
        end: textDocument.positionAt(0),
      },
      relatedInformation: [
        {
          message: `Error: ${e.message}`,
          location: {
            range: {
              end: textDocument.positionAt(0),
              start: textDocument.positionAt(0),
            },
            uri: textDocument.uri,
          },
        },
      ],
    });
    documentValidationsCache.delete(textDocument.uri);
  }

  // Send the computed diagnostics to VSCode.
  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

interface Context {
  document?: TextDocument;
}

type Event = {
  type: "DOCUMENT_DID_CHANGE";
  document: TextDocument;
};

const serverMachine = createMachine<Context, Event>({
  initial: "validating",
  context: {},
  on: {
    DOCUMENT_DID_CHANGE: {
      target: ".throttling",
      actions: assign((context, event) => {
        return {
          document: event.document,
        };
      }),
    },
  },
  states: {
    throttling: {
      after: {
        300: "validating",
      },
    },
    validating: {
      invoke: {
        src: async (context) => {
          if (!context.document) return;
          await validateDocument(context.document);
        },
        onDone: {
          target: "idle",
        },
        onError: {
          target: "idle",
          actions: (context, event) => {
            connection.console.log(JSON.stringify(event.data));
          },
        },
      },
    },
    idle: {},
  },
});

const serverService = interpret(serverMachine).start();

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  serverService.send({
    type: "DOCUMENT_DID_CHANGE",
    document: change.document,
  });
});

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log("We received an file change event");
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    const machinesParseResult = documentValidationsCache.get(
      _textDocumentPosition.textDocument.uri,
    );

    if (!machinesParseResult) {
      return [];
    }
    connection.console.log(JSON.stringify(_textDocumentPosition));

    const cursor = getCursorHoverType(
      machinesParseResult,
      _textDocumentPosition.position,
    );

    if (cursor?.type === "TARGET") {
      const possibleTransitions = getTransitionsFromNode(
        createMachine(cursor.machine.config).getStateNodeByPath(
          cursor.state.path,
        ),
      );

      return possibleTransitions.map((transition) => {
        return {
          insertText: transition,
          label: transition,
          kind: CompletionItemKind.EnumMember,
        };
      });
    }
    if (cursor?.type === "INITIAL") {
      const state = createMachine(cursor.machine.config).getStateNodeByPath(
        cursor.state.path,
      );

      return Object.keys(state.states).map((state) => {
        return {
          label: state,
          insertText: state,
          kind: CompletionItemKind.EnumMember,
        };
      });
    }

    return [];
  },
);

const getTargetMatchingCursor = (
  state: MachineParseResultState,
  position: Position,
) => {
  return state.targets.find((target) => {
    return isCursorInPosition(target.location, position);
  });
};

const getInitialMatchingCursor = (
  state: MachineParseResultState,
  position: Position,
) => {
  if (!state.initial) return;
  return isCursorInPosition(state.initial?.location, position);
};

const isCursorInPosition = (
  nodeLocation: Location,
  cursorPosition: Position,
) => {
  const isOnSameLine = nodeLocation.start.line - 1 === cursorPosition.line;

  if (!isOnSameLine) return false;

  const isWithinChars =
    cursorPosition.character >= nodeLocation.start.column &&
    cursorPosition.character <= nodeLocation.end.column;

  return isWithinChars;
};

const getCursorHoverType = (
  parsedMachines: MachineParseResult[],
  position: Position,
):
  | {
      type: "TARGET";
      state: MachineParseResultState;
      machine: MachineParseResult;
      target: MachineParseResultTarget;
    }
  | {
      type: "INITIAL";
      state: MachineParseResultState;
      machine: MachineParseResult;
      target: MachineParseResultTarget;
    }
  | void => {
  for (const machine of parsedMachines) {
    for (const state of machine.statesMeta) {
      const target = getTargetMatchingCursor(state, position);
      if (target) {
        return {
          type: "TARGET",
          machine,
          state,
          target,
        };
      }
      if (getInitialMatchingCursor(state, position)) {
        return {
          type: "INITIAL",
          state,
          machine,
          target: state.initial!,
        };
      }
    }
  }
};

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  return item;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
