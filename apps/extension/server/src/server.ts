import {
  MachineParseResult,
  parseMachinesFromFile,
} from '@xstate/machine-extractor';
import {
  filterOutIgnoredMachines,
  getInlineImplementations,
  getRangeFromSourceLocation,
  getRawTextFromNode,
  getSetOfNames,
  getTransitionsFromNode,
  getTsTypesEdits,
  getTypegenData,
  GlobalSettings,
  isCursorInPosition,
} from '@xstate/tools-shared';
import deepEqual from 'fast-deep-equal';
import { CodeLens, Position } from 'vscode-languageserver';
import { TextDocument, TextEdit } from 'vscode-languageserver-textdocument';
import {
  CompletionItem,
  CompletionItemKind,
  DidChangeConfigurationNotification,
  InitializeResult,
  TextDocumentSyncKind,
} from 'vscode-languageserver/node';
import { URI, Utils as UriUtils } from 'vscode-uri';
import { createMachine } from 'xstate';
import { connection } from './connection';
import { getCursorHoverType } from './getCursorHoverType';
import { getDiagnostics } from './getDiagnostics';
import { getReferences } from './getReferences';
import { CachedDocument } from './types';

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

const defaultSettings: GlobalSettings = {
  showVisualEditorWarnings: true,
};
let globalSettings: GlobalSettings = defaultSettings;

let displayedMachine: { uri: string; machineIndex: number } | undefined;

connection.onInitialize((params) => {
  const capabilities = params.capabilities;

  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      codeActionProvider: {
        resolveProvider: true,
      },
      declarationProvider: {
        documentSelector: [
          'typescript',
          'typescriptreact',
          'javascript',
          'javascriptreact',
          // TODO: figure out how can we support vue, svelte and more
        ],
      },
      definitionProvider: true,
      referencesProvider: true,
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
  let cachedResult = documentSettings.get(resource);
  if (cachedResult) {
    return cachedResult;
  }
  const configurationPromise = connection.workspace.getConfiguration({
    scopeUri: resource,
    section: 'xstate',
  });
  documentSettings.set(resource, configurationPromise);
  return configurationPromise;
}

connection.documents.onDidClose(({ document }) => {
  documentsCache.delete(document.uri);
  documentSettings.delete(document.uri);
});

const documentsCache: Map<string, CachedDocument> = new Map();

connection.onReferences((params) => {
  const cachedDocument = documentsCache.get(params.textDocument.uri);
  if (!cachedDocument) {
    return;
  }
  return getReferences(params, cachedDocument);
});

connection.onDefinition((params) => {
  const cachedDocument = documentsCache.get(params.textDocument.uri);
  if (!cachedDocument) {
    return;
  }
  // TOOD: this should return a definition and not references
  return getReferences(params, cachedDocument);
});

// TODO: make the registered code lenses type-safe
connection.onCodeLens(({ textDocument }) => {
  const cachedDocument = documentsCache.get(textDocument.uri);

  if (!cachedDocument) {
    return [];
  }

  return cachedDocument.machineResults.flatMap(
    (machineResult, index): CodeLens[] => {
      const callee = machineResult.ast.callee;
      return [
        {
          range: getRangeFromSourceLocation(callee.loc!),
          command: {
            title: 'Open Visual Editor',
            command: 'stately-xstate.edit-code-lens',
            arguments: [textDocument.uri, index],
          },
        },
        {
          range: getRangeFromSourceLocation(callee.loc!),
          command: {
            title: 'Open Inspector',
            command: 'stately-xstate.inspect',
            arguments: [textDocument.uri, index],
          },
        },
      ];
    },
  );
});

async function handleDocumentChange(textDocument: TextDocument): Promise<void> {
  const previouslyCachedDocument = documentsCache.get(textDocument.uri);
  try {
    const text = textDocument.getText();
    const [settings, machineResults] = await Promise.all([
      getDocumentSettings(textDocument.uri),
      filterOutIgnoredMachines(parseMachinesFromFile(text)).machines,
    ]);

    const types = machineResults
      .filter((machineResult) => !!machineResult.ast.definition?.tsTypes?.node)
      .map((machineResult, index) =>
        getTypegenData(
          UriUtils.basename(URI.parse(textDocument.uri)),
          index,
          machineResult,
        ),
      );

    documentsCache.set(textDocument.uri, {
      documentText: text,
      machineResults,
      types,
    });

    if (displayedMachine?.uri === textDocument.uri) {
      const machineResult = machineResults[displayedMachine.machineIndex];
      connection.sendNotification('displayedMachineUpdated', {
        config: machineResult.toConfig()!,
        layoutString: machineResult.getLayoutComment()?.value,
        implementations: getInlineImplementations(machineResult, text),
        namedGuards:
          machineResult.getAllConds(['named']).map((elem) => elem.name) || [],
      });
    }
    connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics: getDiagnostics(machineResults, textDocument, settings),
    });
    if (
      types.some((t) => t.typesNode.value === t.data.tsTypesValue) &&
      !deepEqual(
        previouslyCachedDocument?.types.map((t) => t.data),
        types.map((t) => t.data),
      )
    ) {
      connection.sendNotification('typesUpdated', {
        uri: textDocument.uri,
        types,
      });
    }
  } catch (e) {
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
  }
}

connection.documents.onDidChangeContent(({ document }) => {
  documentsCache.delete(document.uri);
  handleDocumentChange(document);
});

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    documentSettings.clear();
  } else {
    globalSettings = <GlobalSettings>(
      (change.settings.languageServerExample || defaultSettings)
    );
  }

  connection.documents.all().forEach(handleDocumentChange);
});

connection.onCompletion(({ textDocument, position }): CompletionItem[] => {
  const cachedDocument = documentsCache.get(textDocument.uri);

  if (!cachedDocument) {
    return [];
  }

  const cursor = getCursorHoverType(cachedDocument.machineResults, position);

  if (cursor?.type === 'TARGET') {
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
  if (cursor?.type === 'INITIAL') {
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

  if (cursor?.type === 'ACTION') {
    const actions = getSetOfNames(cursor.machine.getAllActions(['named']));

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

  if (cursor?.type === 'COND') {
    const conds = getSetOfNames(cursor.machine.getAllConds(['named']));

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

  if (cursor?.type === 'SERVICE') {
    const services = getSetOfNames(
      cursor.machine
        .getAllServices(['named'])
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
});

// we don't have any additional things to resolve here
// the `ServerCapabilities['completionProvider']` type doesn't accept `true` though
// so it suggests that it's required or something, maybe `completionProvider: {}` would work
connection.onCompletionResolve((item) => item);

connection.onCodeAction((params) => {
  const cachedDocument = documentsCache.get(params.textDocument.uri);

  if (!cachedDocument) {
    return [];
  }
  const result = getCursorHoverType(
    cachedDocument.machineResults,
    params.range.start,
  );

  if (result?.type === 'ACTION') {
    return [
      {
        title: `Add ${result.name} to options`,
        edit: {
          changes: {
            [params.textDocument.uri]: getTextEditsForImplementation(
              result.machine,
              'actions',
              result.name,
              cachedDocument.documentText,
            ),
          },
        },
      },
    ];
  }
  if (result?.type === 'SERVICE') {
    return [
      {
        title: `Add ${result.name} to options`,
        edit: {
          changes: {
            [params.textDocument.uri]: getTextEditsForImplementation(
              result.machine,
              'services',
              result.name,
              cachedDocument.documentText,
            ),
          },
        },
      },
    ];
  }
  if (result?.type === 'COND') {
    return [
      {
        title: `Add ${result.name} to options`,
        edit: {
          changes: {
            [params.textDocument.uri]: getTextEditsForImplementation(
              result.machine,
              'guards',
              result.name,
              cachedDocument.documentText,
            ),
          },
        },
      },
    ];
  }
  return [];
});

const getTextEditsForImplementation = (
  machine: MachineParseResult,
  type: 'services' | 'actions' | 'guards',
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

connection.onRequest('getMachineAtIndex', ({ uri, machineIndex }) => {
  const cachedDocument = documentsCache.get(uri);

  if (!cachedDocument || !cachedDocument.machineResults.length) {
    throw new Error('There were no machines recognized in this document');
  }

  const machineResult = cachedDocument.machineResults[machineIndex];

  if (!machineResult) {
    throw new Error(
      `Machine ${machineIndex} was not found. This document has only ${cachedDocument.machineResults.length} machine(s)`,
    );
  }

  return {
    config: machineResult.toConfig({
      hashInlineImplementations: true,
    })!,
    layoutString: machineResult.getLayoutComment()?.value,
    implementations: getInlineImplementations(
      machineResult,
      cachedDocument.documentText,
    ),
    namedGuards: Array.from(
      getSetOfNames(machineResult.getAllConds(['named'])),
    ),
  };
});

connection.onRequest('getMachineAtCursorPosition', ({ uri, position }) => {
  const cachedDocument = documentsCache.get(uri);

  if (!cachedDocument || !cachedDocument.machineResults.length) {
    throw new Error('There were no machines recognized in this document');
  }

  const vsCodePosition = Position.create(position.line, position.column);

  const machineResultIndex = cachedDocument.machineResults.findIndex(
    (machineResult) => {
      return (
        isCursorInPosition(
          machineResult.ast.definition?.node?.loc!,
          vsCodePosition,
        ) ||
        isCursorInPosition(
          machineResult.ast.options?.node?.loc!,
          vsCodePosition,
        )
      );
    },
  );

  if (machineResultIndex === -1) {
    throw new Error(
      `Machine at position ${JSON.stringify(position)} was not found`,
    );
  }

  const machineResult = cachedDocument.machineResults[machineResultIndex];

  return {
    config: machineResult.toConfig({
      hashInlineImplementations: true,
    })!,
    machineIndex: machineResultIndex,
    layoutString: machineResult.getLayoutComment()?.value,
    implementations: getInlineImplementations(
      machineResult,
      cachedDocument.documentText,
    ),
    namedGuards: Array.from(
      getSetOfNames(machineResult.getAllConds(['named'])),
    ),
  };
});

connection.onRequest('applyMachineEdits', ({ machineEdits }) => {
  if (!displayedMachine) {
    throw new Error(
      '`applyMachineEdits` can only be requested when there is a displayed machine',
    );
  }

  const modified = documentsCache
    .get(displayedMachine.uri)!
    .machineResults[displayedMachine.machineIndex].modify(machineEdits);

  return {
    textEdits: [
      {
        type: 'replace' as const,
        uri: displayedMachine.uri,
        range: modified.range,
        newText: modified.newText,
      },
    ],
  };
});

connection.onRequest('getTsTypesEdits', ({ uri }) => {
  const cachedDocument = documentsCache.get(uri);
  if (!cachedDocument) {
    return [];
  }
  return getTsTypesEdits(cachedDocument.types).map((edit) => ({
    type: 'replace',
    uri,
    ...edit,
  }));
});

connection.onRequest('getNodePosition', ({ path }) => {
  if (!displayedMachine) {
    return;
  }

  const cachedDocument = documentsCache.get(displayedMachine.uri);

  if (!cachedDocument) {
    return;
  }

  const machineResult =
    cachedDocument.machineResults[displayedMachine.machineIndex];

  const node = machineResult.getStateNodeByPath(path);

  if (!node) {
    return;
  }

  return [
    {
      line: node.ast.node.loc!.start.line,
      column: node.ast.node.loc!.start.column,
      index: node.ast.node.start!,
    },
    {
      line: node.ast.node.loc!.end.line,
      column: node.ast.node.loc!.end.column,
      index: node.ast.node.end!,
    },
  ];
});

connection.onRequest('setDisplayedMachine', ({ uri, machineIndex }) => {
  displayedMachine = { uri, machineIndex };
});

connection.onRequest('clearDisplayedMachine', () => {
  displayedMachine = undefined;
});

connection.listen();
