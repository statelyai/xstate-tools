#!/usr/bin/env node

import { extractMachinesFromFile } from '@xstate/machine-extractor';
import {
  TypegenData,
  getTsTypesEdits,
  getTypegenData,
  getTypegenOutput,
  processFileEdits,
} from '@xstate/tools-shared';
import { watch } from 'chokidar';
import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import { version } from '../package.json';

async function removeFile(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (e: any) {
    if ((e as { code: string })?.code === 'ENOENT') {
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return require(require.resolve('prettier', { paths: [cwd] }));
  } catch (err) {
    if (!err || (err as { code: string }).code !== 'MODULE_NOT_FOUND') {
      throw err;
    }
    // we load our own prettier instance lazily on purpose to speed up the init time
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
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
    prettierInstance.format(getTypegenOutput(types), {
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        (value) => ({ status: 'fulfilled' as const, value }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

        await writeToTypegenFile(typegenUri, types, { cwd });

        const edits = getTsTypesEdits(types);
        if (edits.length > 0) {
          const newFile = processFileEdits(fileContents, edits);
          await fs.writeFile(uri, newFile);
        }
        console.log(`${uri} - success`);
      } catch (e: any) {
        if ((e as { code: string })?.code === 'BABEL_PARSER_SYNTAX_ERROR') {
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
  .action((filesPattern: string, opts: { watch?: boolean }) => {
    const cwd = process.cwd();
    if (opts.watch) {
      // TODO: implement per path queuing to avoid tasks related to the same file from overlapping their execution
      const processFile = (path: string) => {
        if (path.endsWith('.typegen.ts')) {
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-empty-function
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
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        .on('ready', async () => {
          const settled = await allSettled(tasks);
          if (settled.some((result) => result.status === 'rejected')) {
            process.exit(1);
          }
          process.exit(0);
        });
    }
  });

program.parse(process.argv);
