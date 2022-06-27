#!/usr/bin/env node

import { parseMachinesFromFile } from "@xstate/machine-extractor";
import {
  doesTsTypesRequireUpdate,
  FileEdit,
  makeXStateUpdateEvent,
  processFileEdits,
  writeToFetchedMachineFile,
  writeToTypegenFile,
} from "@xstate/tools-shared";
import { watch } from "chokidar";
import { Command } from "commander";
import * as fs from "fs/promises";
import * as path from "path";
import { version } from "../package.json";

// TODO: just use the native one when support for node 12 gets dropped
const allSettled: typeof Promise.allSettled = (promises: Promise<any>[]) =>
  Promise.all(
    promises.map((promise) =>
      promise.then(
        (value) => ({ status: "fulfilled" as const, value }),
        (reason) => ({ status: "rejected" as const, reason })
      )
    )
  );

const program = new Command();

program.version(version);

const writeToFiles = async (uriArray: string[]) => {
  /**
   * TODO - implement pretty readout
   */
  await Promise.all(
    uriArray.map(async (uri) => {
      try {
        const fileContents = await fs.readFile(uri, "utf8");
        const parseResult = parseMachinesFromFile(fileContents);

        if (!parseResult.machines.length) {
          return;
        }

        const event = makeXStateUpdateEvent(
          uri,
          parseResult.machines.map((machine) => ({
            parseResult: machine,
          }))
        );

        const fileEdits: FileEdit[] = [];
        let machineIndex = 0;

        for (const machine of parseResult.machines) {
          if (machine.ast.definition?.tsTypes?.node) {
            const { name } = path.parse(uri);
            const requiresUpdate = doesTsTypesRequireUpdate({
              fileText: fileContents,
              machineIndex,
              node: machine.ast.definition.tsTypes.node,
              relativePath: name,
            });

            if (requiresUpdate) {
              fileEdits.push({
                start: machine.ast.definition.tsTypes.node.start!,
                end: machine.ast.definition.tsTypes.node.end!,
                newText: `{} as import("./${name}.typegen").Typegen${machineIndex}`,
              });
            }
            machineIndex++;
          }
        }

        if (fileEdits.length > 0) {
          const newFile = processFileEdits(fileContents, fileEdits);

          await fs.writeFile(uri, newFile);
        }

        await writeToTypegenFile({
          filePath: uri,
          event,
        });
        console.log(`${uri} - success`);
      } catch (e: any) {
        if (e?.code === "BABEL_PARSER_SYNTAX_ERROR") {
          console.error(`${uri} - syntax error, skipping`);
        } else {
          console.error(`${uri} - error, `, e);
        }
        throw e;
      }
    })
  );
};

program
  .command("typegen")
  .description("Generate TypeScript types from XState machines")
  .argument("<files>", "The files to target, expressed as a glob pattern")
  .option("-w, --watch", "Run the typegen in watch mode")
  .action(async (filesPattern: string, opts: { watch?: boolean }) => {
    if (opts.watch) {
      // TODO: implement per path queuing to avoid tasks related to the same file from overlapping their execution
      const processFile = (path: string) => {
        if (path.endsWith(".typegen.ts")) {
          return;
        }
        writeToFiles([path]).catch(() => {});
      };
      // TODO: handle removals
      watch(filesPattern, { awaitWriteFinish: true })
        .on("add", processFile)
        .on("change", processFile);
    } else {
      const tasks: Array<Promise<void>> = [];
      // TODO: could this cleanup outdated typegen files?
      watch(filesPattern, { persistent: false })
        .on("add", (path) => {
          if (path.endsWith(".typegen.ts")) {
            return;
          }
          tasks.push(writeToFiles([path]));
        })
        .on("ready", async () => {
          const settled = await allSettled(tasks);
          if (settled.some((result) => result.status === "rejected")) {
            process.exit(1);
          }
          process.exit(0);
        });
    }
  });

const getMachinesWriteToFiles = async (uriArray: string[]) => {
  await Promise.all(
    uriArray.map(async (uri) => {
      try {
        const fileContents = await fs.readFile(uri, "utf8");
        const parseResult = parseMachinesFromFile(fileContents);
        if (parseResult.machines.length > 0) {
          const parsedMachine = parseResult.machines[0];
          const machineId = parsedMachine.getMachineId();
          if (machineId) {
            const machine: any = await fetch("https://api-prod.stately.ai/", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                query: `{
                  getMachine(id:"${machineId}") {
                    name
                    updatedAt
                    asXStateMachineConfig
                  }
                }`,
              }),
            })
              .then((response: any) => response.json())
              .then(({ data }: { data: any }) => data.getMachine)
              .catch((error: any) => {
                console.error(error);
                return undefined;
              });

            await writeToFetchedMachineFile({
              filePath: uri,
              machine,
            });
            console.log(`${uri} - success`);
          }
        }
      } catch (e: any) {
        if (e?.code === "BABEL_PARSER_SYNTAX_ERROR") {
          console.error(`${uri} - syntax error, skipping`);
        } else {
          console.error(`${uri} - error, `, e);
        }
        throw e;
      }
    })
  );
};

program
  .command("getMachines")
  .description("Get XState machines from the Stately Editor")
  .argument("<files>", "The files to target, expressed as a glob pattern")
  .option("-w, --watch", "Run getMachines in watch mode")
  .action(async (filesPattern: string, opts: { watch?: boolean }) => {
    if (opts.watch) {
      // TODO: implement per path queuing to avoid tasks related to the same file from overlapping their execution
      const processFile = (path: string) => {
        if (path.endsWith(".typegen.ts")) {
          return;
        }
        getMachinesWriteToFiles([path]).catch(() => {});
      };
      // TODO: handle removals
      watch(filesPattern, { awaitWriteFinish: true })
        .on("add", processFile)
        .on("change", processFile);
    } else {
      const tasks: Array<Promise<void>> = [];
      // TODO: could this cleanup outdated typegen files?
      watch(filesPattern, { persistent: false })
        .on("add", (path) => {
          if (path.endsWith(".typegen.ts")) {
            return;
          }
          tasks.push(getMachinesWriteToFiles([path]));
        })
        .on("ready", async () => {
          const settled = await allSettled(tasks);
          if (settled.some((result) => result.status === "rejected")) {
            process.exit(1);
          }
          process.exit(0);
        });
    }
  });

program.parse(process.argv);
