#!/usr/bin/env node

import {
  extractMachinesFromFile,
  extractSkyConfigFromFile,
  modifySkyConfigSource,
} from '@xstate/machine-extractor';
import {
  SkyConfig,
  TypegenData,
  doesSkyConfigExist,
  getTsTypesEdits,
  getTypegenData,
  getTypegenOutput,
  processFileEdits,
  writeSkyConfig,
} from '@xstate/tools-shared';
import { watch } from 'chokidar';
import { Command } from 'commander';
import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fetch } from 'undici';
import { version } from '../package.json';

async function removeFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (e: any) {
    if (e?.code === 'ENOENT') {
      return;
    }
    throw e;
  }
}

let prettier: typeof import('prettier') | undefined;

function getPrettierInstance(cwd: string): typeof import('prettier') {
  if (prettier) {
    return prettier;
  }
  try {
    return require(require.resolve('prettier', { paths: [cwd] }));
  } catch (err) {
    if (!err || (err as any).code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
    // we load our own prettier instance lazily on purpose to speed up the init time
    return (prettier = require('prettier'));
  }
}

const writeToTypegenFile = async (
  typegenUri: string,
  types: TypegenData[],
  { cwd }: { cwd: string },
) => {
  const prettierInstance = getPrettierInstance(cwd);
  await fs.writeFile(
    typegenUri,
    // // Prettier v3 returns a promise
    await prettierInstance.format(getTypegenOutput(types), {
      ...(await prettierInstance.resolveConfig(typegenUri)),
      parser: 'typescript',
    }),
  );
};

// TODO: just use the native one when support for node 12 gets dropped
const allSettled: typeof Promise.allSettled = (promises: Promise<any>[]) =>
  Promise.all(
    promises.map((promise) =>
      promise.then(
        (value) => ({ status: 'fulfilled' as const, value }),
        (reason) => ({ status: 'rejected' as const, reason }),
      ),
    ),
  );

const program = new Command();

program.version(version);

const writeToFiles = async (uriArray: string[], { cwd }: { cwd: string }) => {
  /**
   * TODO - implement pretty readout
   */
  await Promise.all(
    uriArray.map(async (uri) => {
      try {
        const fileContents = await fs.readFile(uri, 'utf8');

        const extracted = extractMachinesFromFile(fileContents);

        if (!extracted) {
          return;
        }

        const typegenUri =
          uri.slice(0, -path.extname(uri).length) + '.typegen.ts';

        const types = extracted.machines
          .filter(
            (
              machineResult,
            ): machineResult is NonNullable<typeof machineResult> =>
              !!machineResult?.machineCallResult.definition?.tsTypes?.node,
          )
          .map((machineResult, index) =>
            getTypegenData(path.basename(uri), index, machineResult),
          );

        if (types.length) {
          await writeToTypegenFile(typegenUri, types, { cwd });
        } else {
          await removeFile(typegenUri);
        }

        const edits = getTsTypesEdits(types);
        if (edits.length > 0) {
          const newFile = processFileEdits(fileContents, edits);
          await fs.writeFile(uri, newFile);
        }
        console.log(`${uri} - success`);
      } catch (e: any) {
        if (e?.code === 'BABEL_PARSER_SYNTAX_ERROR') {
          console.error(`${uri} - syntax error, skipping`);
        } else {
          console.error(`${uri} - error, `, e);
        }
        throw e;
      }
    }),
  );
};

program
  .command('typegen')
  .description('Generate TypeScript types from XState machines')
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .option('-w, --watch', 'Run the typegen in watch mode')
  .action(async (filesPattern: string, opts: { watch?: boolean }) => {
    const cwd = process.cwd();
    if (opts.watch) {
      // TODO: implement per path queuing to avoid tasks related to the same file from overlapping their execution
      const processFile = (path: string) => {
        if (path.endsWith('.typegen.ts')) {
          return;
        }
        writeToFiles([path], { cwd }).catch(() => {});
      };
      // TODO: handle removals
      watch(filesPattern, { awaitWriteFinish: true })
        .on('add', processFile)
        .on('change', processFile);
    } else {
      const tasks: Array<Promise<void>> = [];
      // TODO: could this cleanup outdated typegen files?
      watch(filesPattern, { persistent: false })
        .on('add', (path) => {
          if (path.endsWith('.typegen.ts')) {
            return;
          }
          tasks.push(writeToFiles([path], { cwd }));
        })
        .on('ready', async () => {
          const settled = await allSettled(tasks);
          if (settled.some((result) => result.status === 'rejected')) {
            process.exit(1);
          }
          process.exit(0);
        });
    }
  });

/*
 * This function is used to expand a skyUrl to the final config API URL
 */
async function skyUrlExpander(
  skyUrl: string | undefined | null,
): Promise<string | undefined> {
  if (skyUrl && skyUrl.length > 0) {
    try {
      // Fetch the skyUrl, but don't automatically follow redirects
      const skyResponse = await fetch(skyUrl, { redirect: 'manual' });

      // If there is a potential redirect follow it
      if (skyResponse.status === 307) {
        return await skyUrlExpander(skyResponse.headers.get('Location'));
      } else if (skyResponse.status === 200) {
        // If there is no redirect, we have the final config API URL
        return skyUrl;
      }
    } catch (error) {
      console.error('skyUrlExpander error', error);
      throw error;
    }
  }
}

async function fetchSkyConfig(skyUrl: string | undefined | null) {
  const skyConfigUrl = await skyUrlExpander(skyUrl);
  if (skyConfigUrl) {
    const url = new URL(skyConfigUrl);
    const actorId = url.searchParams.get('actorId');
    if (actorId) {
      return {
        actorId,
        origin: url.origin,
      };
    } else {
      throw new Error(
        `URL does not point to a valid workflow, please contact support@stately.ai with the URL ${skyUrl}`,
      );
    }
  } else {
    throw new Error(
      `URL does not point to a valid workflow, please contact support@stately.ai with the URL ${skyUrl}`,
    );
  }
}

const writeSkyConfigToFiles = async (opts: {
  uri: string;
  apiKey: string | undefined;
}) => {
  try {
    console.error(`Processing ${opts.uri}`);
    if (doesSkyConfigExist(opts.uri)) {
      console.log('SkyConfig for machine already exists, skipping');
      return;
    }
    const fileContents = await fs.readFile(opts.uri, 'utf8');
    const parseResult = extractSkyConfigFromFile(fileContents);
    if (!parseResult) return;
    await Promise.all(
      parseResult.skyConfigs.map(async (config) => {
        const skyUrl = config?.url?.value;
        const skyInfo = await fetchSkyConfig(skyUrl);
        const apiKey = config?.apiKey?.value ?? opts.apiKey;
        if (skyInfo && apiKey && apiKey.length > 0) {
          const url = new URL(
            `${skyInfo.origin}/registry/api/sky/actor-config`,
          );
          url.searchParams.set('actorId', skyInfo.actorId);
          url.searchParams.set('addTsTypes', 'false');
          url.searchParams.set('addSchema', 'true');
          url.searchParams.set('wrapInCreateMachine', 'true');
          url.searchParams.set(
            'xstateVersion',
            config?.xstateVersion?.value ?? '5',
          );
          const configResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const skyConfig = (await configResponse.json()) as SkyConfig;

          await writeSkyConfig({
            filePath: opts.uri,
            skyConfig,
          });

          await modifySkyConfigSource({ filePath: opts.uri });
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

program
  .command('connect')
  .description(
    'Get your machine configs from the Stately Studio, and write them to local files',
  )
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .option('-w, --watch', 'Run connect in watch mode')
  .option(
    '-k, --api-key <key>',
    'API key to use for interacting with the Stately Studio',
  )
  .option('-h, --host <host>', 'URL pointing to the Stately Studio host')
  .action(
    async (
      filesPattern: string,
      opts: { watch?: boolean; apiKey?: string; host?: string },
    ) => {
      const envApiKey = process.env.STATELY_API_KEY;
      const apiKey = opts.apiKey ?? envApiKey;

      if (opts.watch) {
        const processFile = (uri: string) => {
          writeSkyConfigToFiles({ uri, apiKey }).catch((e) => {
            console.error(e);
          });
        };
        watch(filesPattern, { awaitWriteFinish: true })
          .on('add', processFile)
          .on('change', processFile);
      } else {
        const tasks: Array<Promise<void>> = [];
        watch(filesPattern, { persistent: false })
          .on('add', (uri) => {
            tasks.push(writeSkyConfigToFiles({ uri, apiKey }));
          })
          .on('ready', async () => {
            const settled = await allSettled(tasks);
            if (settled.some((result) => result.status === 'rejected')) {
              process.exit(1);
            }
            process.exit(0);
          });
      }
    },
  );

program.parse(process.argv);
