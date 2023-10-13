#!/usr/bin/env node

import { watch } from 'chokidar';
import { Command } from 'commander';
import 'dotenv/config';
import { version } from '../package.json';
import { writeConfigToFiles } from './sky/writeConfigToFiles';
import { writeToFiles } from './typegen/writeToFiles';
import { allSettled } from './utils';

const program = new Command();
program.version(version);

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

program
  .command('sky')
  .description(
    'Get your machine configs from the Stately Studio, and write them to local files',
  )
  .argument('<files>', 'The files to target, expressed as a glob pattern')
  .option('-w, --watch', 'Run sky in watch mode')
  .option('-f, --force', 'Always overwrite existing sky configs')
  .option(
    '-k, --api-key <key>',
    'API key to use for interacting with the Stately Studio',
  )
  .action(
    async (
      filesPattern: string,
      opts: {
        force?: boolean;
        watch?: boolean;
        apiKey?: string;
        host?: string;
      },
    ) => {
      const cwd = process.cwd();
      const envApiKey = process.env.SKY_API_KEY;
      const apiKey = opts.apiKey ?? envApiKey;
      if (opts.watch) {
        const processFile = (uri: string) => {
          writeConfigToFiles({
            uri,
            apiKey,
            forceFetch: opts.force === true,
            writeToFiles,
            cwd,
          }).catch((e) => {
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
            tasks.push(
              writeConfigToFiles({
                uri,
                apiKey,
                forceFetch: opts.force === true,
                writeToFiles,
                cwd,
              }),
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
