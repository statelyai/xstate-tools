/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import type { SourceLocation } from "@babel/types";
import { TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionItem,
  CompletionItemKind,
  createConnection,
  Diagnostic,
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
  createMachine,
  interpret,
  StateMachine,
  StateNode,
} from "xstate";
import { parseMachinesFromFile, StringLiteralNode } from "xstate-parser-demo";
import { MachineParseResult } from "xstate-parser-demo/lib/MachineParseResult";
import { StateNodeReturn } from "xstate-parser-demo/lib/stateNode";
import {
  getTransitionsFromNode,
  introspectMachine,
  IntrospectMachineResult,
} from "xstate-vscode-shared";
import { miscDiagnostics } from "./diagnostics/misc";
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

export type DocumentValidationsResult = {
  machine?: StateMachine<any, any, any>;
  parseResult?: MachineParseResult;
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
  return machinesParseResult.flatMap((machine) => {
    const firstState = machine.parseResult?.ast?.definition;
    return {
      range: getRangeFromSourceLocation(firstState?.node.loc!)!,
      command: {
        title: "Create Typed Options",
        command: "xstate.create-typed-options",
        arguments: [machine.introspectionResult, params.textDocument.uri],
      },
    };
  });
});

async function validateDocument(textDocument: TextDocument): Promise<void> {
  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();

  const diagnostics: Diagnostic[] = [];

  try {
    const machines: DocumentValidationsResult[] = parseMachinesFromFile(
      text,
    ).machines.map((parseResult) => {
      if (!parseResult) {
        return {};
      }

      const config = parseResult.toConfig();
      try {
        const machine = createMachine(config!);
        const introspectionResult = introspectMachine(machine);
        return {
          parseResult,
          machine,
          introspectionResult,
        };
      } catch (e) {
        return {
          parseResult,
        };
      }
    });
    documentValidationsCache.set(textDocument.uri, machines);

    diagnostics.push(
      ...getDiagnostics(machines, textDocument, miscDiagnostics),
    );
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
        createMachine(cursor.machine.toConfig()!).getStateNodeByPath(
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
      const state = createMachine(
        cursor.machine.toConfig()!,
      ).getStateNodeByPath(cursor.state.path);

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
