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

const writeToFiles = async (
  uriArray: string[],
  {
    cwd,
    useDeclarationFileForTypegenData = false,
  }: {
    cwd: string;
    useDeclarationFileForTypegenData: boolean | undefined;
  },
) => {
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
          uri.slice(0, -path.extname(uri).length) +
          `.typegen${useDeclarationFileForTypegenData ? '.d' : ''}.ts`;

        const types = extracted.machines
          .filter(
            (
              machineResult,
            ): machineResult is NonNullable<typeof machineResult> =>
              !!machineResult?.machineCallResult.definition?.tsTypes?.node,
          )
          .map((machineResult, index) =>
            getTypegenData(path.basename(uri), index, machineResult, {
              useDeclarationFileForTypegenData,
            }),
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
  .option(
    '--useDeclarationFileForTypegenData',
    "Generate typegen data into `.d.ts` files and use this extension in the import's source that refers to it.",
  )
  .action(
    async (
      filesPattern: string,
      opts: { watch?: boolean; useDeclarationFileForTypegenData?: boolean },
    ) => {
      const cwd = process.cwd();
      const { useDeclarationFileForTypegenData } = opts;
      if (opts.watch) {
        // TODO: implement per path queuing to avoid tasks related to the same file from overlapping their execution
        const processFile = (path: string) => {
          if (path.endsWith('.typegen.ts') || path.endsWith('.typegen.d.ts')) {
            return;
          }
          writeToFiles([path], { cwd, useDeclarationFileForTypegenData }).catch(
            () => {},
          );
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
            tasks.push(
              writeToFiles([path], { cwd, useDeclarationFileForTypegenData }),
            );
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
