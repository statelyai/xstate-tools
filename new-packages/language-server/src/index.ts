import {
  createConnection,
  createServer,
  createTypeScriptProjectProvider,
} from '@volar/language-server/node.js';
import { XStateProject, createProject } from '@xstate/ts-project';
import type { LanguageService } from 'typescript';
import {
  Provide,
  create as createTypeScriptService,
} from 'volar-service-typescript';
import { applyPatches, getMachineAtIndex } from './protocol';

const projectCache = new WeakMap<LanguageService, XStateProject>();

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
  return server.initialize(params, createTypeScriptProjectProvider, {
    watchFileExtensions: [
      'cjs',
      'cts',
      'js',
      'jsx',
      'json',
      'mjs',
      'mts',
      'ts',
      'tsx',
    ],
    getServicePlugins: () => {
      const service = createTypeScriptService(getTsLib());
      return [
        service,
        {
          create: () => {
            return {
              provideCodeLenses: async (textDocument) => {
                const xstateProject = await getXStateProject(textDocument.uri);
                if (!xstateProject) {
                  return [];
                }

                const fileName = server.env.uriToFileName(textDocument.uri);

                // TODO: a range is returned here regardless of the extraction status (extraction could error)
                // DX has to account for this somehow or results with errors have to be ignored (this would be slower but it might be a good tradeoff)
                return xstateProject
                  .findMachines(fileName)
                  .map((range, index) => {
                    return {
                      command: {
                        title: 'Open Visual Editor',
                        command: 'stately-xstate/edit-machine',
                        arguments: [textDocument.uri, index],
                      },
                      range: xstateProject.getLinesAndCharactersRange(
                        fileName,
                        range,
                      ),
                    };
                  });
              },
            };
          },
        },
      ];
    },
    getLanguagePlugins: () => [],
  });
});

connection.onRequest(getMachineAtIndex, async ({ uri, machineIndex }) => {
  const xstateProject = await getXStateProject(uri);

  if (!xstateProject) {
    return;
  }

  // TODO: it would be faster to extract a single machine instead of all of them
  const [digraph] = xstateProject.getMachinesInFile(
    server.env.uriToFileName(uri),
  )[machineIndex];

  return digraph;
});

connection.onRequest(applyPatches, async ({ uri, machineIndex, patches }) => {
  const xstateProject = await getXStateProject(uri);

  if (!xstateProject) {
    return [];
  }

  const edits = xstateProject.applyPatches({
    fileName: server.env.uriToFileName(uri),
    machineIndex,
    patches,
  });

  return edits.map((edit) => {
    switch (edit.type) {
      case 'delete':
        return {
          type: edit.type,
          uri: server.env.fileNameToUri(edit.fileName),
          range: xstateProject.getLinesAndCharactersRange(
            edit.fileName,
            edit.range,
          ),
        };
      case 'insert':
        return {
          type: edit.type,
          uri: server.env.fileNameToUri(edit.fileName),
          position: xstateProject.getLineAndCharacterOfPosition(
            edit.fileName,
            edit.position,
          ),
          newText: edit.newText,
        };
      case 'replace':
        return {
          type: 'replace' as const,
          uri: server.env.fileNameToUri(edit.fileName),
          range: xstateProject.getLinesAndCharactersRange(
            edit.fileName,
            edit.range,
          ),
          newText: edit.newText,
        };
    }
  });
});

connection.onInitialized(() => {
  server.initialized();
});

connection.onShutdown(() => {
  server.shutdown();
});

function getTsLib() {
  const ts = server.modules.typescript;
  if (!ts) {
    throw new Error('TypeScript module is missing');
  }
  return ts;
}

async function getTypeScriptModule(uri: string) {
  return (await server.projects.getProject(uri))
    .getLanguageService()
    .context.inject<Provide, 'typescript/typescript'>('typescript/typescript');
}

async function getTypeScriptLanguageService(uri: string) {
  return (await server.projects.getProject(uri))
    .getLanguageService()
    .context.inject<Provide, 'typescript/languageService'>(
      'typescript/languageService',
    );
}

async function getXStateProject(uri: string) {
  const languageService = await getTypeScriptLanguageService(uri);
  if (!languageService) {
    return;
  }
  const tsProgram = languageService.getProgram();
  if (!tsProgram) {
    return;
  }
  const existing = projectCache.get(languageService);
  if (existing) {
    existing.updateTsProgram(tsProgram);
    return existing;
  }
  const xstateProject = createProject(
    await getTypeScriptModule(uri),
    tsProgram,
  );
  projectCache.set(languageService, xstateProject);
  return xstateProject;
}
