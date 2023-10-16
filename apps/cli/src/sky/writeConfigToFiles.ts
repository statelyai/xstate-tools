import { SkyConfig } from '@statelyai/sky';
import {
  modifySkyConfigSource,
  skyConfigExtractFromFile,
} from '@xstate/machine-extractor';
import { doesSkyConfigExist, writeSkyConfig } from '@xstate/tools-shared';
import 'dotenv/config';
import * as fs from 'fs/promises';
import fetch from 'isomorphic-fetch';
import { writeToFiles } from '../typegen/writeToFiles';
import { getPrettierInstance } from '../utils';
import { fetchSkyConfig } from './urlUtils';

export const writeConfigToFiles = async (opts: {
  uri: string;
  apiKey: string | undefined;
  writeToFiles: typeof writeToFiles;
  forceFetch: boolean;
  cwd: string;
}) => {
  try {
    if (!opts.forceFetch && doesSkyConfigExist(opts.uri)) {
      console.log(`${opts.uri} - skipping, sky config already exists`);
      return;
    }
    const fileContents = await fs.readFile(opts.uri, 'utf8');
    const parseResult = skyConfigExtractFromFile(fileContents);
    if (!parseResult) return;
    await Promise.all(
      parseResult.skyConfigs.map(async (config) => {
        const skyUrl = config?.url?.value;
        // Detect this from the version of the `@stately/sky` package in the file
        const xstateVersion = config?.xstateVersion?.value ?? '5';
        const runTypeGen = xstateVersion === '4';
        const skyInfo = await fetchSkyConfig(skyUrl);
        const apiKey = config?.apiKey?.value ?? opts.apiKey;
        if (!apiKey) {
          console.error(
            'Error: API key is required to connect to Stately, but none was found. Read more here https://stately.ai/docs/sky.',
          );
          return;
        }
        if (skyInfo) {
          const url = new URL(
            `${skyInfo.origin}/registry/api/sky/actor-config`,
          );
          url.searchParams.set('actorId', skyInfo.actorId);
          url.searchParams.set('addTsTypes', runTypeGen ? 'true' : 'false');
          url.searchParams.set('addSchema', 'true');
          url.searchParams.set('wrapInCreateMachine', 'true');
          url.searchParams.set('xstateVersion', xstateVersion);
          const configResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          try {
            const skyConfig = (await configResponse.json()) as SkyConfig;
            await writeSkyConfig({
              filePath: opts.uri,
              skyConfig,
              createTypeGenFile: runTypeGen ? writeToFiles : undefined,
            });

            const fileContents = await fs.readFile(opts.uri, 'utf8');
            const code = await modifySkyConfigSource({
              fileContents,
              filePath: opts.uri,
            });
            if (code) {
              const prettierInstance = getPrettierInstance(opts.cwd);
              const formattedCode = await prettierInstance.format(code, {
                ...(await prettierInstance.resolveConfig(opts.uri)),
                parser: 'typescript',
              });
              await fs.writeFile(opts.uri, formattedCode);
              console.log(`${opts.uri} - updated with sky config`);
            }
          } catch (error) {
            console.error(error);
          }
        }
      }),
    );
  } catch (e: any) {
    if (e?.code === 'BABEL_PARSER_SYNTAX_ERROR') {
      console.error(`${opts.uri} - syntax error, skipping`);
    } else {
      console.error(`${opts.uri} - error, `, e);
    }
    throw e;
  }
};
