import { Command } from "commander";
import * as path from "path";
import { watch } from "chokidar";
import * as fs from "fs/promises";
import { parseMachinesFromFile } from "@xstate/machine-extractor";
import {
  doesTsTypesRequireUpdate,
  FileEdit,
  makeXStateUpdateEvent,
  processFileEdits,
  writeToTypegenFile,
} from "@xstate/tools-shared";
import { version } from "../package.json";

export const program = new Command();

program.version(version);

const handleError = (uri: string, e: any) => {
  if (e?.code === "BABEL_PARSER_SYNTAX_ERROR") {
    console.log(`${uri} - syntax error, skipping`);
  }
  if (process.env.NODE_ENV === "test") {
    console.log(e);
  }
};

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
          })),
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
      } catch (e) {
        handleError(uri, e);
      }
    }),
  );
};

export const runTypegen = (filesPattern: string, opts: { watch?: boolean }) => {
  return new Promise<void>((resolve, reject) => {
    if (opts.watch) {
      // TODO: implement per path queuing to avoid tasks related to the same file from overlapping their execution
      const processFile = (path: string) => {
        if (path.endsWith(".typegen.ts")) {
          return;
        }
        writeToFiles([path]);
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
          await Promise.all(tasks);
          resolve(undefined);
          if (process.env.NODE_ENV !== "test") {
            process.exit(0);
          }
        });
    }
  });
};

program
  .command("typegen")
  .description("Generate TypeScript types from XState machines")
  .argument("<files>", "The files to target, expressed as a glob pattern")
  .option("-w, --watch", "Run the typegen in watch mode")
  .action(runTypegen);
