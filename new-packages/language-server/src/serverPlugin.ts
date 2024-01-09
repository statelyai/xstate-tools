import { Connection, ServerPlugin } from '@volar/language-server';
import { XStateProject, createProject } from '@xstate/ts-project';
import type { Program } from 'typescript';
import {
  Provide,
  create as createTypeScriptService,
} from 'volar-service-typescript';
import { helloRequest } from './protocol';

export const createXStateServerPlugin =
  (connection: Connection): ServerPlugin =>
  ({ modules, env }) => {
    return {
      typescript: {
        extraFileExtensions: [
          // TODO: in the future support for `.vue` and `.svelte` files should likely be added here
        ],
      },

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

      async resolveConfig(config) {
        if (!modules.typescript) {
          throw new Error('TypeScript module is missing');
        }

        (config.services ||= {}).typescript ||= createTypeScriptService(
          modules.typescript,
        );

        return config;
      },
      onInitialized(projects) {
        const projectCache = new WeakMap<Program, XStateProject>();

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
            env.uriToFileName(textDocument.uri),
          );

          connection.console.log(JSON.stringify(machines));

          return true;
        });

        async function getTypeScriptModule(uri: string) {
          return (await projects.getProject(uri))
            .getLanguageService()
            .context.inject<Provide, 'typescript/typescript'>(
              'typescript/typescript',
            );
        }

        async function getTypeScriptLanguageService(uri: string) {
          return (await projects.getProject(uri))
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
      },
    };
  };
