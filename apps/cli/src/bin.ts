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

// Used to prettify text before writing
const prettify = async (
  uri: string,
  text: string,
  { cwd }: { cwd: string },
) => {
  const prettierInstance = getPrettierInstance(cwd);
  return prettierInstance.format(text, {
    ...(await prettierInstance.resolveConfig(uri)),
    parser: 'typescript',
  });
};

const writeToTypegenFile = async (
  typegenUri: string,
  types: TypegenData[],
  { cwd }: { cwd: string },
) => {
  const output = await prettify(typegenUri, getTypegenOutput(types), { cwd });
  await fs.writeFile(typegenUri, output);
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

        // Find the first import statement and check what quote style it uses
        // We will consider that the quote style to use for our import statement
        const quoteMatch = fileContents.match(/import\s(.|\n)*?(['"])/);
        // Default quote style to "
        let quoteStyle = '"';
        if (quoteMatch !== null && quoteMatch.length > 2) {
          // Get the second group from the match
          quoteStyle = quoteMatch[2];
          // Ensure that the quote is either a ' or "
          if (quoteStyle !== '"' && quoteStyle !== "'") {
            quoteStyle = '"';
          }
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

        const edits = getTsTypesEdits(types, quoteStyle);
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

program.parse(process.argv);
