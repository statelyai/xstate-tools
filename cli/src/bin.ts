#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import fg from "fast-glob";
import { watch } from "chokidar";
import * as fs from "fs/promises";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  doesTsTypesRequireUpdate,
  FileEdit,
  makeXStateUpdateEvent,
  processFileEdits,
  writeToTypegenFile,
} from "xstate-tools-shared";

const program = new Command();

program.version("0.0.1");

const handleError = (uri: string, e: any) => {
  if (e?.code === "BABEL_PARSER_SYNTAX_ERROR") {
    console.log(`${uri} - syntax error, skipping`);
  }
};

const writeToFiles = async (uriArray: string[]) => {
  /**
   * TODO - implement batching to speed things up
   * TODO - implement pretty readout
   */
  for (const uri of uriArray) {
    try {
      const fileContents = await fs.readFile(uri, "utf8");
      const parseResult = parseMachinesFromFile(fileContents);
      const event = makeXStateUpdateEvent(
        uri,
        parseResult.machines.map((machine) => ({
          parseResult: machine,
        })),
      );

      const fileEdits: FileEdit[] = [];

      for (const machine of parseResult.machines) {
        let machineIndex = 0;
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
  }
};

program
  .command("typegen")
  .description("Generate TypeScript types from XState machines")
  .argument("<files>", "The files to target, expressed as a glob pattern")
  .option("-w, --watch", "Run the typegen in watch mode")
  .action(async (files: string, opts: { watch?: boolean }) => {
    const allFiles = await fg(files);

    await writeToFiles(allFiles);

    if (opts.watch) {
      watch(files, {}).on("change", (path) => {
        if (path.endsWith(".typegen.ts")) {
          return;
        }
        writeToFiles([path]);
      });
    }
  });

program.parse(process.argv);
