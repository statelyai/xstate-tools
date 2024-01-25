import {
  createConnection,
  createServer,
  createTypeScriptProjectProvider,
} from '@volar/language-server/node.js';
import { XStateProject, createProject } from '@xstate/ts-project';
import type { Program } from 'typescript';
import {
  Provide,
  create as createTypeScriptService,
} from 'volar-service-typescript';
import { helloRequest } from './protocol';

const projectCache = new WeakMap<Program, XStateProject>();

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
    getServicePlugins: () => [createTypeScriptService(getTsLib())],
    getLanguagePlugins: () => [],
  });
});

connection.onInitialized(() => {
  server.initialized();
});

connection.onRequest(helloRequest, async ({ textDocument, name }) => {
  if (!textDocument) {
    connection.console.log(`Hello, ${name}!`);
    return true;
  }
  const tsProgram = (
    await getTypeScriptLanguageService(textDocument.uri)
  ).getProgram();

  if (!tsProgram) {
    return false;
  }

  const xstateProject = getOrCreateXStateProject(
    await getTypeScriptModule(textDocument.uri),
    tsProgram,
  );

  const machines = xstateProject.extractMachines(
    server.env.uriToFileName(textDocument.uri),
  );

  connection.console.log(JSON.stringify(machines));

  return true;
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

function getOrCreateXStateProject(
  ts: typeof import('typescript'),
  tsProgram: Program,
) {
  const existing = projectCache.get(tsProgram);
  if (existing) {
    return existing;
  }
  const xstateProject = createProject(ts, tsProgram);
  projectCache.set(tsProgram, xstateProject);
  return xstateProject;
}
