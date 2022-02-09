#!/usr/bin/env node

import { Command } from "commander";
import * as path from "path";
import fg from "fast-glob";
import { watch } from "chokidar";
import * as fs from "fs";
import { promisify } from "util";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  doesTsTypesRequireUpdate,
  makeXStateUpdateEvent,
  writeToTypegenFile,
} from "xstate-vscode-shared";

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

type FileEdit = {
  start: number;
  end: number;
  newText: string;
};

const processFileEdits = (oldText: string, fileEdits: FileEdit[]): string => {
  let newText = oldText;
  for (let i = 0; i < fileEdits.length; i++) {
    const fileEdit = fileEdits[i];
    const futureFileEdits = fileEdits.slice(i + 1);
    newText =
      newText.slice(0, fileEdit.start) +
      fileEdit.newText +
      newText.slice(fileEdit.end);

    /**
     * If the file edits are after this one, increment them
     * by the length of the new text MINUS the length of the old
     */
    const oldTextLength = fileEdit.end - fileEdit.start;
    const lengthDifference = fileEdit.newText.length - oldTextLength;
    futureFileEdits.forEach((futureFileEdit) => {
      if (futureFileEdit.start > fileEdit.end) {
        futureFileEdit.start += lengthDifference;
        futureFileEdit.end += lengthDifference;
      }
    });
  }
  return newText;
};

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
      const fileContents = await readFile(uri, "utf8");
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
          const relativePath = removeExtension(path.basename(uri));
          const requiresUpdate = doesTsTypesRequireUpdate({
            fileText: fileContents,
            machineIndex,
            node: machine.ast.definition.tsTypes.node,
            relativePath,
          });

          if (requiresUpdate) {
            fileEdits.push({
              start: machine.ast.definition.tsTypes.node.start!,
              end: machine.ast.definition.tsTypes.node.end!,
              newText: `{} as import("./${relativePath}.typegen").Typegen${machineIndex}`,
            });
          }
          machineIndex++;
        }
      }

      if (fileEdits.length > 0) {
        const newFile = processFileEdits(fileContents, fileEdits);

        await writeFile(uri, newFile);
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

const removeExtension = (input: string) => {
  return input.substr(0, input.lastIndexOf("."));
};
