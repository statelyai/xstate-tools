import {
  extractMachinesFromFile,
  getMachineExtractResult,
  getMachineNodesFromFile,
  MachineExtractResult,
} from '@xstate/machine-extractor';
import {
  createIntrospectableMachine,
  filterOutIgnoredMachines,
  getInlineImplementations,
  getRangeFromSourceLocation,
  getRawTextFromNode,
  getSetOfNames,
  getTransitionsFromNode,
  getTsTypesEdits,
  getTypegenData,
  GlobalSettings,
  introspectMachine,
  isCursorInPosition,
  TypegenData,
  TypegenOptions,
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
import {
  getErrorMessage,
  isTypedMachineResult,
  isTypegenData,
  mergeOverlappingEdits,
} from './utils';

const getTypegenUri = (
  uri: string,
  { useDeclarationFileForTypegenData }: TypegenOptions,
) => {
  const parsedUri = URI.parse(uri);
  return parsedUri
    .with({
      path:
        parsedUri.path.slice(0, -UriUtils.extname(parsedUri).length) +
        `.typegen${useDeclarationFileForTypegenData ? '.d' : ''}.ts`,
    })
    .toString();
};

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;

const defaultSettings: GlobalSettings = {
  showVisualEditorWarnings: true,
  useDeclarationFileForTypegenData: false,
};
let globalSettings: GlobalSettings = defaultSettings;

let displayedMachine:
  | {
      uri: string;
      machineIndex: number;
      error?: { type: 'missing_index'; message: string } | undefined;
    }
  | undefined;

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

// TODO: rethink if the cached document can ever be reliably cleared
// we can't clear this in `connection.documents.onDidClose`
// because a machine from the closed document might be displayed
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

  return cachedDocument.extractionResults.flatMap(
    ({ machineResult }, index): CodeLens[] => {
      const callee = machineResult?.machineCallResult.callee;
      if (!callee) {
        return [];
      }
      return [
        {
          range: getRangeFromSourceLocation(callee.loc!),
          command: {
            title: 'Open Visual Editor',
            command: 'stately-xstate.edit-code-lens',
            arguments: [textDocument.uri, index],
          },
        },
      ];
    },
  );
});

const areTypesWritable = (typegenData: TypegenData) =>
  deepEqual(typegenData.typesNode.value, typegenData.data.tsTypesValue);

async function handleDocumentChange(textDocument: TextDocument): Promise<void> {
  const previouslyCachedDocument = documentsCache.get(textDocument.uri);
  try {
    const text = textDocument.getText();

    let extracted;

    try {
      extracted = extractMachinesFromFile(text);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        err.code === 'BABEL_PARSE_ERROR'
      ) {
        handleDocumentExtractionFailure(
          textDocument,
          {
            type: 'syntax',
            message: getErrorMessage(err),
          },
          previouslyCachedDocument,
        );
        return;
      }
      throw err;
    }

    if (!extracted) {
      return;
    }

    const [settings, machineResults] = await Promise.all([
      getDocumentSettings(textDocument.uri),
      filterOutIgnoredMachines(extracted).machines,
    ]);

    const extractionResults = machineResults.map((machineResult, index) => {
      try {
        if (isTypedMachineResult(machineResult)) {
          // Create typegen data for typed machines. This will throw if there are any errors.
          return {
            machineResult,
            types: getTypegenData(
              UriUtils.basename(URI.parse(textDocument.uri)),
              index,
              machineResult,
              settings,
            ),
          };
        } else {
          // for the time being we are piggy-backing on the fact that `createMachine` called in `instrospectMachine` might throw for invalid configs
          introspectMachine(createIntrospectableMachine(machineResult) as any);
          return { machineResult };
        }
      } catch (e) {
        return {
          machineResult,
          configError: getErrorMessage(e),
        };
      }
    });

    const types = extractionResults
      .map((machine) => machine.types)
      .filter(isTypegenData);

    documentsCache.set(textDocument.uri, {
      documentText: text,
      extractionResults,
      undoStack: previouslyCachedDocument?.undoStack ?? [],
    });

    if (displayedMachine?.uri === textDocument.uri) {
      // this isn't quite great but I don't know how to best "point" to a specific machine in a document
      // ideally, we'd have a stable reference to it and we wouldn't be sensitive to the order of machines in the document
      if (!extractionResults[displayedMachine.machineIndex]) {
        // in this branch we don't want to clear the displayed machine, that would lead to a weird DX
        // let's keep it as displayed with the error banner
        const ordinal = displayedMachine.machineIndex + 1;
        const ordinalString =
          ordinal === 1
            ? 'first'
            : ordinal === 2
            ? 'second'
            : ordinal === 3
            ? 'third'
            : `${ordinal}th`;

        displayedMachine.error = {
          type: 'missing_index',
          message: `You were previously viewing ${ordinalString} machine in this file. That no longer exists.`,
        };

        connection.sendNotification('extractionError', {
          message: displayedMachine.error.message,
        });
      } else {
        const extractionResult =
          extractionResults[displayedMachine.machineIndex];

        if (!extractionResult) {
          throw new Error('Oops');
        }
        const { configError, machineResult } = extractionResult;

        if (configError) {
          connection.sendNotification('extractionError', {
            message: configError,
          });
          return;
        }

        if (
          (previouslyCachedDocument &&
            (previouslyCachedDocument.error ||
              previouslyCachedDocument.extractionResults[
                displayedMachine.machineIndex
              ]?.configError)) ||
          displayedMachine.error
        ) {
          // If we got this far we can safely assume that the machine config is valid and we can clear any potential errors
          displayedMachine.error = undefined;
          connection.sendNotification('extractionError', {
            message: null,
          });
        }

        const updatedConfig = machineResult.toConfig();
        const previousMachineResult =
          previouslyCachedDocument?.extractionResults[
            displayedMachine.machineIndex
          ]?.machineResult;
        if (
          updatedConfig &&
          previousMachineResult &&
          !deepEqual(previousMachineResult.toConfig(), machineResult.toConfig())
        ) {
          connection.sendNotification('displayedMachineUpdated', {
            config: updatedConfig,
            layoutString: machineResult.getLayoutComment()?.value || null,
            implementations: getInlineImplementations(machineResult, text),
            namedGuards: machineResult
              .getAllConds(['named'])
              .map((elem) => elem.name),
          });
        }
      }
    }

    connection.sendDiagnostics({
      uri: textDocument.uri,
      diagnostics: getDiagnostics(
        machineResults.filter((res): res is NonNullable<typeof res> => !!res),
        textDocument,
        settings,
      ),
    });
    const writableTypes = types.filter(areTypesWritable);
    if (
      writableTypes.length &&
      !deepEqual(
        previouslyCachedDocument?.extractionResults
          .map((extractionResult) => extractionResult.types)
          .filter(isTypegenData)
          .filter(areTypesWritable)
          .map((t) => t.data),
        writableTypes.map((t) => t.data),
      )
    ) {
      connection.sendNotification('typesUpdated', {
        typegenUri: getTypegenUri(textDocument.uri, settings),
        types,
      });
    }
  } catch (e) {
    handleDocumentExtractionFailure(
      textDocument,
      {
        type: 'unknown',
        message: getErrorMessage(e),
      },
      previouslyCachedDocument,
    );
  }
}

const handleDocumentExtractionFailure = (
  textDocument: TextDocument,
  error: NonNullable<CachedDocument['error']>,
  previouslyCachedDocument?: CachedDocument,
) => {
  if (previouslyCachedDocument) {
    previouslyCachedDocument.error = error;
  }

  if (displayedMachine?.uri === textDocument.uri) {
    connection.sendNotification('extractionError', {
      message: error.message,
    });
  }

  connection.sendDiagnostics({ uri: textDocument.uri, diagnostics: [] });
};

connection.documents.onDidChangeContent(({ document }) => {
  handleDocumentChange(document);
});

connection.onDidChangeConfiguration((change) => {
  if (hasConfigurationCapability) {
    documentSettings.clear();
  } else {
    globalSettings =
      (change.settings.xstate as GlobalSettings) || defaultSettings;
  }

  connection.documents.all().forEach(handleDocumentChange);
});

connection.onCompletion(({ textDocument, position }): CompletionItem[] => {
  const cachedDocument = documentsCache.get(textDocument.uri);

  if (!cachedDocument) {
    return [];
  }

  const cursor = getCursorHoverType(cachedDocument.extractionResults, position);

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

    cursor.machine.machineCallResult.options?.actions?.properties.forEach(
      (action) => {
        actions.add(action.key);
      },
    );
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

    cursor.machine.machineCallResult.options?.guards?.properties.forEach(
      (cond) => {
        conds.add(cond.key);
      },
    );
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

    cursor.machine.machineCallResult.options?.services?.properties.forEach(
      (service) => {
        services.add(service.key);
      },
    );
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
    cachedDocument.extractionResults,
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
  machine: MachineExtractResult,
  type: 'services' | 'actions' | 'guards',
  name: string,
  text: string,
): TextEdit[] => {
  const machineDefinitionLoc = machine.machineCallResult.definition?.node.loc;

  if (!machineDefinitionLoc) return [];

  const machineOptionsLoc = machine.machineCallResult.options?.node.loc;

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
  if (!machine.machineCallResult.options?.[type]?.node.loc) {
    const rawText = getRawTextFromNode(
      text,
      machine.machineCallResult.options?.node!,
    );
    const range = getRangeFromSourceLocation(
      machine.machineCallResult.options?.node.loc!,
    );

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

  const existingImplementation = machine.machineCallResult.options?.[
    type
  ]?.properties.find((property) => {
    return property.key === name;
  });

  // If the action already exists in the object, don't do anything
  if (existingImplementation) return [];

  // There is an actions object which does not contain the action
  if (machine.machineCallResult.options?.[type]?.node) {
    const rawText = getRawTextFromNode(
      text,
      machine.machineCallResult.options?.[type]?.node!,
    );
    const range = getRangeFromSourceLocation(
      machine.machineCallResult.options?.[type]?.node.loc!,
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

  if (!cachedDocument || !cachedDocument.extractionResults.length) {
    throw new Error('There were no machines recognized in this document');
  }

  const extractionResult = cachedDocument.extractionResults[machineIndex];

  if (!extractionResult) {
    throw new Error(
      'no extraction result found for given index ' + machineIndex,
    );
  }

  const machineResult = extractionResult.machineResult;

  if (!machineResult) {
    throw new Error(
      `Machine ${machineIndex} was not found. This document has only ${cachedDocument.extractionResults.length} machine(s)`,
    );
  }

  return {
    config: machineResult.toConfig()!,
    layoutString: machineResult.getLayoutComment()?.value || null,
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

  if (!cachedDocument || !cachedDocument.extractionResults.length) {
    throw new Error('There were no machines recognized in this document');
  }

  const vsCodePosition = Position.create(position.line, position.column);

  const machineResultIndex = cachedDocument.extractionResults.findIndex(
    ({ machineResult }) => {
      if (!machineResult) {
        return false;
      }
      return (
        isCursorInPosition(
          machineResult.machineCallResult.definition?.node?.loc!,
          vsCodePosition,
        ) ||
        isCursorInPosition(
          machineResult.machineCallResult.options?.node?.loc!,
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

  const extractionResult = cachedDocument.extractionResults[machineResultIndex];

  if (!extractionResult) {
    throw new Error(
      'no extraction result found for given index ' + machineResultIndex,
    );
  }

  const machineResult = extractionResult.machineResult;

  return {
    config: machineResult.toConfig()!,
    machineIndex: machineResultIndex,
    layoutString: machineResult.getLayoutComment()?.value || null,
    implementations: getInlineImplementations(
      machineResult,
      cachedDocument.documentText,
    ),
    namedGuards: Array.from(
      getSetOfNames(machineResult.getAllConds(['named'])),
    ),
  };
});

connection.onRequest('applyMachineEdits', ({ machineEdits, reason }) => {
  if (!displayedMachine) {
    throw new Error(
      '`applyMachineEdits` can only be requested when there is a displayed machine',
    );
  }
  const displayedUri = displayedMachine.uri;

  const cachedDocument = documentsCache.get(displayedUri)!;
  const isLayoutStringOnlyUpdate =
    machineEdits.length === 1 &&
    machineEdits[0]!.type === 'update_layout_string';

  let modified: ReturnType<
    MachineExtractResult['modify'] | MachineExtractResult['restore']
  >;

  const extractionResult =
    cachedDocument.extractionResults[displayedMachine.machineIndex];
  if (!extractionResult) {
    throw new Error('No extraction result found');
  }
  if (!isLayoutStringOnlyUpdate && reason === 'undo') {
    const item = cachedDocument.undoStack.pop();

    if (item) {
      modified = extractionResult.machineResult.restore(item);
    } else {
      modified = extractionResult.machineResult.modify(machineEdits);
    }
  } else {
    const modifyResult = extractionResult.machineResult.modify(machineEdits);

    modified = modifyResult;

    if (!isLayoutStringOnlyUpdate) {
      cachedDocument.undoStack.push(
        modifyResult.deleted ? { deleted: modifyResult.deleted } : undefined,
      );
    }
  }
  const edits = mergeOverlappingEdits(
    [
      modified.configEdit,
      'layoutEdit' in modified ? modified.layoutEdit : undefined,
    ].filter((edit): edit is NonNullable<typeof edit> => !!edit),
  );

  let newDocumentText = cachedDocument.documentText;

  for (const edit of edits) {
    newDocumentText =
      newDocumentText.slice(0, edit.range[0].index) +
      edit.newText +
      newDocumentText.slice(edit.range[1].index);
  }

  // TODO: figure out a better solution, the extraction that happens here is kinda wasteful
  const { file, machineNodes } = getMachineNodesFromFile(newDocumentText);

  // this kinda also should update types, but at the moment we don't need it
  // and the whole thing will be refactored anyway
  extractionResult.machineResult = getMachineExtractResult({
    file,
    fileContent: newDocumentText,
    node: machineNodes[displayedMachine.machineIndex]!, // TODO: check
  })!;

  return {
    textEdits: edits.map((textEdit) => ({
      uri: displayedUri,
      ...textEdit,
    })),
  };
});

connection.onRequest('getTsTypesAndEdits', async ({ uri }) => {
  const cachedDocument = documentsCache.get(uri);
  if (!cachedDocument) {
    return;
  }
  const types = cachedDocument.extractionResults
    .map((extractionResult) => extractionResult.types)
    .filter(isTypegenData);

  if (!types.length) {
    return;
  }

  return {
    typegenUri: getTypegenUri(uri, await getDocumentSettings(uri)),
    types,
    edits: getTsTypesEdits(types).map((edit) => ({
      type: 'replace',
      uri,
      ...edit,
    })),
  };
});

connection.onRequest('getNodePosition', ({ path }) => {
  if (!displayedMachine) {
    return;
  }

  const cachedDocument = documentsCache.get(displayedMachine.uri);

  if (!cachedDocument) {
    return;
  }

  const extractionResult =
    cachedDocument.extractionResults[displayedMachine.machineIndex];

  if (!extractionResult) {
    throw new Error('No extraction result found');
  }

  const machineResult = extractionResult.machineResult;

  const node = machineResult.getStateNodeByPath(path);

  if (!node) {
    return;
  }

  return [
    {
      line: node.ast.node.loc!.start.line - 1,
      column: node.ast.node.loc!.start.column,
      index: node.ast.node.start!,
    },
    {
      line: node.ast.node.loc!.end.line - 1,
      column: node.ast.node.loc!.end.column,
      index: node.ast.node.end!,
    },
  ];
});

connection.onRequest('setDisplayedMachine', ({ uri, machineIndex }) => {
  displayedMachine = { uri, machineIndex };
});

connection.onRequest('clearDisplayedMachine', () => {
  if (!displayedMachine) {
    throw new Error('There is no displayed machine to clear');
  }
  const cachedDocument = documentsCache.get(displayedMachine.uri);
  if (!cachedDocument) {
    throw new Error(`Document for the displayed machine couldn't be found`);
  }
  cachedDocument.undoStack = [];
  displayedMachine = undefined;
});

connection.listen();
