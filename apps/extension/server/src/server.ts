/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import { CodeLens } from "vscode-languageserver";
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
} from "vscode-languageserver/node";
import { assign, createMachine, interpret } from "xstate";
import { MachineParseResult } from "@xstate/machine-extractor/src/MachineParseResult";
import {
  DocumentValidationsResult,
  getDocumentValidationsResults,
  getRangeFromSourceLocation,
  getRawTextFromNode,
  getSetOfNames,
  getTransitionsFromNode,
  GlobalSettings,
  makeXStateUpdateEvent,
} from "@xstate/tools-shared";
import { getCursorHoverType } from "./getCursorHoverType";
import { getDiagnostics } from "./getDiagnostics";
import { getReferences } from "./getReferences";

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

const defaultSettings: GlobalSettings = { showVisualEditorWarnings: true };
let globalSettings: GlobalSettings = defaultSettings;

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

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Full,
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
});

// Cache the settings of all open documents
let documentSettings: Map<string, Thenable<GlobalSettings>> = new Map();

function getDocumentSettings(resource: string): Thenable<GlobalSettings> {
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "xstate",
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  documentSettings.delete(e.document.uri);
});

const documentValidationsCache: Map<string, DocumentValidationsResult[]> =
  new Map();

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

connection.onCodeLens((params): CodeLens[] => {
  const machinesParseResult = documentValidationsCache.get(
    params.textDocument.uri,
  );

  if (!machinesParseResult) {
    return [];
  }
  return machinesParseResult.flatMap((machine, index): CodeLens[] => {
    const callee = machine.parseResult?.ast?.callee;
    return [
      {
        range: getRangeFromSourceLocation(callee?.loc!),
        command: {
          title: "Open Visual Editor",
          command: "stately-xstate.edit-code-lens",
          arguments: [
            machine.parseResult?.toConfig({ hashInlineImplementations: true }),
            index,
            params.textDocument.uri,
            machine.parseResult?.getLayoutComment()?.value,
          ],
        },
      },
      {
        range: getRangeFromSourceLocation(callee?.loc!),
        command: {
          title: "Open Inspector",
          command: "stately-xstate.inspect",
          arguments: [
            machine.parseResult?.toConfig(),
            index,
            params.textDocument.uri,
            machine.parseResult
              ?.getAllConds(["named"])
              .map((cond) => cond.name),
          ],
        },
      },
    ];
  });
});

async function validateDocument(textDocument: TextDocument): Promise<void> {
  const text = textDocument.getText();
  const settings = await getDocumentSettings(textDocument.uri);

  const diagnostics: Diagnostic[] = [];

  try {
    const machines = getDocumentValidationsResults(text);
    documentValidationsCache.set(textDocument.uri, machines);

    diagnostics.push(...getDiagnostics(machines, textDocument, settings));
    const event = makeXStateUpdateEvent(textDocument.uri, machines);

    connection.sendNotification("xstate/update", event);
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

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <GlobalSettings>(
      (change.settings.languageServerExample || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateDocument);
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
      const actions = getSetOfNames(cursor.machine.getAllActions(["named"]));

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
      const conds = getSetOfNames(cursor.machine.getAllConds(["named"]));

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
      const services = getSetOfNames(
        cursor.machine
          .getAllServices(["named"])
          .map((invoke) => ({ ...invoke, name: invoke.src })),
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
    const rawText = getRawTextFromNode(text, machine.ast.options?.node!);
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
    const rawText = getRawTextFromNode(
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
