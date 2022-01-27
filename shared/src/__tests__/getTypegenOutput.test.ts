import { execSync, spawnSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { parseMachinesFromFile } from "xstate-parser-demo";
import {
  getDocumentValidationsResults,
  getTypegenOutput,
  introspectMachine,
  makeXStateUpdateEvent,
} from "..";

// TODO - write tests for getTypegenOutput
describe("getTypegenOutput", () => {
  execSync("rm -rf ./__examples__/*.typegen.ts", {
    cwd: __dirname,
  });

  const dir = fs.readdirSync(path.resolve(__dirname, "__examples__"));

  const tsExtensionFiles = dir.filter((file) => file.endsWith(".ts"));

  tsExtensionFiles.forEach((file) => {
    const fileText = fs.readFileSync(
      path.resolve(__dirname, "__examples__", file),
      "utf8",
    );

    const event = makeXStateUpdateEvent(
      // URI doesn't matter here
      "",
      getDocumentValidationsResults(fileText),
    );

    fs.writeFileSync(
      path.resolve(
        __dirname,
        "__examples__",
        file.slice(0, -3) + ".typegen.ts",
      ),
      getTypegenOutput(event),
    );
  });

  it("Should pass tsc", () => {
    try {
      execSync(`tsc`, {
        cwd: path.resolve(__dirname, "__examples__"),
      });
    } catch (e: any) {
      throw new Error(e.stdout.toString());
    }
  });
});
