/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { Node } from "@babel/types";
import { TextDocument, TextEdit } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Diagnostic,
  DidChangeConfigurationNotification,
  InitializeParams,
  InitializeResult,
  ProposedFeatures,
  TextDocumentPositionParams,
  TextDocuments,
  TextDocumentSyncKind,
  CodeActionKind,
  WorkspaceEdit,
} from "vscode-languageserver/node";
import {
  assign,
  createMachine,
  interpret,
  StateMachine,
  StateNode,
} from "xstate";
import { parseMachinesFromFile } from "xstate-parser-demo";
import { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";
import {
  filterOutIgnoredMachines,
  getTransitionsFromNode,
  introspectMachine,
  IntrospectMachineResult,
} from "xstate-vscode-shared";
import { getCursorHoverType } from "./getCursorHoverType";
import { getDiagnostics } from "./getDiagnostics";
import { getRangeFromSourceLocation } from "./getRangeFromSourceLocation";
import { getReferences } from "./getReferences";

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
      codeActionProvider: {
        resolveProvider: true,
      },
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

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

export type DocumentValidationsResult = {
  machine?: StateMachine<any, any, any>;
  parseResult?: MachineParseResult;
  introspectionResult?: IntrospectMachineResult;
  documentText: string;
};

const documentValidationsCache: Map<string, DocumentValidationsResult[]> =
  new Map();

const getOrphanedStates = (
  documentValidationsResult: DocumentValidationsResult,
) => {
  const orphanedStatePaths: StateNode<any, any>[] =
    documentValidationsResult.introspectionResult?.states
      .filter((state) => {
        return state.sources.size === 0;
      })
      .map((state) => {
        return documentValidationsResult.machine?.getStateNodeById(state.id)!;
      })
      .filter(Boolean)
      .filter((state) => {
        /**
         * A root node is never orphaned
         */
        if (!state.parent) return false;

        /**
         * Initial states are never orphaned
         */
        if (state.parent.initial === state.key) return false;

        /**
         * Children of parallel states are never orphaned
         */
        if (state.parent.type === "parallel") return false;

        return true;
      }) || [];

  if (!orphanedStatePaths) return [];

  return orphanedStatePaths
    .map((state) => {
      return documentValidationsResult.parseResult?.getStateNodeByPath(
        state.path,
      );
    })
    .filter(Boolean);
};

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

connection.onReferences((params) => {
  return getReferences({
    ...params,
    machinesParseResult:
      documentValidationsCache.get(params.textDocument.uri) || [],
  });
});

connection.onDefinition((params) => {
  return getReferences({
    ...params,
    machinesParseResult:
      documentValidationsCache.get(params.textDocument.uri) || [],
  });
});

connection.onCodeLens((params) => {
  const machinesParseResult = documentValidationsCache.get(
    params.textDocument.uri,
  );

  if (!machinesParseResult) {
    return [];
  }
  return machinesParseResult.flatMap((machine, index) => {
    const callee = machine.parseResult?.ast?.callee;
    return [
      {
        range: getRangeFromSourceLocation(callee?.loc!),
        command: {
          title: "Open Inspector",
          command: "xstate.inspect",
          arguments: [
            machine.parseResult?.toConfig()!,
            index,
            params.textDocument.uri,
            Object.keys(machine.parseResult?.getAllNamedConds() || {}),
          ],
        },
      },
    ];
  });
});

async function validateDocument(textDocument: TextDocument): Promise<void> {
  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();

  const diagnostics: Diagnostic[] = [];

  try {
    const machines: DocumentValidationsResult[] = filterOutIgnoredMachines(
      parseMachinesFromFile(text),
    ).machines.map((parseResult) => {
      if (!parseResult) {
        return {
          documentText: text,
        };
      }

      const config = parseResult.toConfig();
      try {
        const machine = createMachine(config as any);
        const introspectionResult = introspectMachine(machine as any);
        return {
          parseResult,
          machine,
          introspectionResult,
          documentText: text,
        };
      } catch (e) {
        return {
          parseResult,
          documentText: text,
        };
      }
    });
    documentValidationsCache.set(textDocument.uri, machines);

    diagnostics.push(...getDiagnostics(machines, textDocument));

    machines.forEach((machine, index) => {
      const config = machine.parseResult?.toConfig();
      if (config) {
        connection.sendNotification("xstate/update", {
          config,
          uri: textDocument.uri,
          index,
          guardsToMock: Object.keys(
            machine.parseResult?.getAllNamedConds() || {},
          ).filter(Boolean),
        });
      }
    });
  } catch (e) {
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
        200: "validating",
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
        createMachine(cursor.machine.toConfig() as any).getStateNodeByPath(
          cursor.state.path,
        ) as any,
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
      const state = createMachine(
        cursor.machine.toConfig() as any,
      ).getStateNodeByPath(cursor.state.path);

      return Object.keys(state.states).map((state) => {
        return {
          label: state,
          insertText: state,
          kind: CompletionItemKind.EnumMember,
        };
      });
    }

    if (cursor?.type === "ACTION") {
      const actions = new Set<string>(
        Object.keys(cursor.machine.getAllNamedActions()),
      );

      cursor.machine.ast.options?.actions?.properties.forEach((action) => {
        actions.add(action.key);
      });
      return Array.from(actions).map((actionName) => {
        return {
          label: actionName,
          insertText: actionName,
          kind: CompletionItemKind.EnumMember,
        };
      });
    }

    if (cursor?.type === "COND") {
      const conds = new Set<string>(
        Object.keys(cursor.machine.getAllNamedConds()),
      );

      cursor.machine.ast.options?.guards?.properties.forEach((cond) => {
        conds.add(cond.key);
      });
      return Array.from(conds).map((condName) => {
        return {
          label: condName,
          insertText: condName,
          kind: CompletionItemKind.EnumMember,
        };
      });
    }

    if (cursor?.type === "SERVICE") {
      const services = new Set<string>(
        Object.keys(cursor.machine.getAllNamedServices()),
      );

      cursor.machine.ast.options?.services?.properties.forEach((service) => {
        services.add(service.key);
      });
      return Array.from(services).map((serviceName) => {
        return {
          label: serviceName,
          insertText: serviceName,
          kind: CompletionItemKind.EnumMember,
        };
      });
    }

    return [];
  },
);

connection.onCodeAction((params) => {
  const machinesParseResult = documentValidationsCache.get(
    params.textDocument.uri,
  );

  if (!machinesParseResult) {
    return [];
  }
  const result = getCursorHoverType(machinesParseResult, params.range.start);

  if (result?.type === "ACTION") {
    return [
      {
        title: `Add ${result.name} to options`,
        edit: {
          changes: {
            [params.textDocument.uri]: getTextEditsForImplementation(
              result.machine,
              "actions",
              result.name,
              machinesParseResult[0].documentText,
            ),
          },
        },
      },
    ];
  }
  if (result?.type === "SERVICE") {
    return [
      {
        title: `Add ${result.name} to options`,
        edit: {
          changes: {
            [params.textDocument.uri]: getTextEditsForImplementation(
              result.machine,
              "services",
              result.name,
              machinesParseResult[0].documentText,
            ),
          },
        },
      },
    ];
  }
  if (result?.type === "COND") {
    return [
      {
        title: `Add ${result.name} to options`,
        edit: {
          changes: {
            [params.textDocument.uri]: getTextEditsForImplementation(
              result.machine,
              "guards",
              result.name,
              machinesParseResult[0].documentText,
            ),
          },
        },
      },
    ];
  }
  return [];
});

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

const getTextEditsForImplementation = (
  machine: MachineParseResult,
  type: "services" | "actions" | "guards",
  name: string,
  text: string,
): TextEdit[] => {
  const machineDefinitionLoc = machine.ast.definition?.node.loc;

  if (!machineDefinitionLoc) return [];

  const machineOptionsLoc = machine.ast.options?.node.loc;

  // There is no options object, so add it after the definition
  if (!machineOptionsLoc) {
    const range = getRangeFromSourceLocation(machineDefinitionLoc);

    return [
      {
        range: {
          start: range.end,
          end: range.end,
        },
        newText: `, { ${type}: { '${name}': () => {} } }`,
      },
    ];
  }

  // There is an options object, but it doesn't contain an actions object
  if (!machine.ast.options?.[type]?.node.loc) {
    const rawText = getRawTextFromLocation(text, machine.ast.options?.node!);
    const range = getRangeFromSourceLocation(machine.ast.options?.node.loc!);

    return [
      {
        range: range,
        newText: `${rawText.slice(
          0,
          1,
        )} ${type}: { '${name}': () => {} }, ${rawText.slice(1)}`,
      },
    ];
  }

  const existingImplementation = machine.ast.options?.[type]?.properties.find(
    (property) => {
      return property.key === name;
    },
  );

  // If the action already exists in the object, don't do anything
  if (existingImplementation) return [];

  // There is an actions object which does not contain the action
  if (machine.ast.options?.[type]?.node) {
    const rawText = getRawTextFromLocation(
      text,
      machine.ast.options?.[type]?.node!,
    );
    const range = getRangeFromSourceLocation(
      machine.ast.options?.[type]?.node.loc!,
    );

    return [
      {
        range: range,
        newText: `${rawText.slice(0, 1)} '${name}': () => {}, ${rawText.slice(
          1,
        )}`,
      },
    ];
  }

  return [];
};

const getRawTextFromLocation = (text: string, node: Node): string => {
  return text.slice(node.start!, node.end!);
};
