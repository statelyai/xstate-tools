import { Connection, ServerPlugin } from '@volar/language-server';
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

      async resolveConfig(config, env, projectContext) {
        if (!modules.typescript) {
          throw new Error('TypeScript module is missing');
        }

        (config.services ||= {}).typescript = createTypeScriptService(
          modules.typescript,
        );

        return config;
      },
      onInitialized(projects) {
        connection.onRequest(helloRequest, async ({ textDocument, name }) => {
          if (!textDocument) {
            connection.console.log(`Hello, ${name}!`);
            return true;
          }
          const languageService = await getTypeScriptLanguageService(
            textDocument.uri,
          );

          connection.console.log(
            `Hello in "${languageService
              .getProgram()
              ?.getCurrentDirectory()}", ${name}! You are viewing:\n\n${
              languageService
                .getProgram()!
                .getSourceFile(env.uriToFileName(textDocument.uri))!.text
            }`,
          );
          return true;
        });

        async function getTypeScriptLanguageService(uri: string) {
          return (await projects.getProject(uri))
            .getLanguageService()
            .context.inject<Provide, 'typescript/languageService'>(
              'typescript/languageService',
            );
        }
      },
    };
  };
