#!/usr/bin/env node

import {
  extractLiveMachinesFromFile,
  extractMachinesFromFile,
  modifyLiveMachineSource,
} from '@xstate/machine-extractor';
import {
  SkyConfig,
  TypegenData,
  doesFetchedMachineFileExist,
  getTsTypesEdits,
  getTypegenData,
  getTypegenOutput,
  processFileEdits,
  writeToFetchedMachineFile,
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

const writeLiveMachinesToFiles = async (opts: {
  uri: string;
  apiKey: string | undefined;
  host: string | undefined;
}) => {
  try {
    console.error(`Processing ${opts.uri}`);
    if (doesFetchedMachineFileExist(opts.uri)) {
      console.log('Fetched machine file already exists, skipping');
      return;
    }

    const fileContents = await fs.readFile(opts.uri, 'utf8');
    const parseResult = extractLiveMachinesFromFile(fileContents);
    if (!parseResult) return;
    await Promise.all(
      parseResult.liveMachines.map(async (liveMachine) => {
        const machineVersionId = liveMachine?.machineVersionId?.value;
        const apiKey = liveMachine?.apiKey?.value ?? opts.apiKey;
        if (
          machineVersionId &&
          machineVersionId.length > 0 &&
          apiKey &&
          apiKey.length > 0
        ) {
          console.error(`Fetching ${machineVersionId}`);
          const url = new URL(
            `${
              opts.host ?? 'https://stately.ai'
            }/registry/api/sky/workflow-machine-config`,
          );
          url.searchParams.set('workflowId', machineVersionId);
          url.searchParams.set('addTsTypes', 'true');
          url.searchParams.set('addSchema', 'true');
          url.searchParams.set('wrapInCreateMachine', 'true');
          url.searchParams.set('xstateVersion', '4');
          const configResponse = await fetch(url, {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          const skyConfig = (await configResponse.json()) as SkyConfig;

          await writeToFetchedMachineFile({
            filePath: opts.uri,
            skyConfig,
            createTypeGenFile: writeToFiles,
          });

          await modifyLiveMachineSource({ filePath: opts.uri });
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
  .command('generate')
  .description(
    'Generate will fetch machine configs, and setup interactions with the Stately Studio',
  )
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .option('-w, --watch', 'Run generate in watch mode')
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
      const host = opts.host ?? process.env.STATELY_HOST;
      const envApiKey = process.env.STATELY_API_KEY;
      const apiKey = opts.apiKey ?? envApiKey;
      console.debug('Running generate');
      console.debug('apiKey', apiKey);
      console.debug('envApiKey', envApiKey);

      if (opts.watch) {
        const processFile = (uri: string) => {
          writeLiveMachinesToFiles({ uri, apiKey, host }).catch((e) => {
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
            tasks.push(writeLiveMachinesToFiles({ uri, apiKey, host }));
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
