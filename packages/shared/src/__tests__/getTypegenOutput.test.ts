import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import {
  getDocumentValidationsResults,
  getTypegenOutput,
  makeXStateUpdateEvent,
} from "..";

describe("getTypegenOutput", () => {
  const examplesPath = path.resolve(__dirname, "__examples__");

  fs.readdirSync(examplesPath).forEach((file) => {
    if (file.endsWith(".typegen.ts")) {
      fs.unlinkSync(path.resolve(__dirname, "__examples__", file));
    }
  });

  const tsExtensionFiles = fs
    .readdirSync(examplesPath)
    .filter((file) => file.endsWith(".ts"));

  tsExtensionFiles.forEach((file) => {
    const fileText = fs.readFileSync(
      path.resolve(__dirname, "__examples__", file),
      "utf8"
    );

    const event = makeXStateUpdateEvent(
      // URI doesn't matter here
      "",
      getDocumentValidationsResults(fileText)
    );

    fs.writeFileSync(
      path.resolve(
        __dirname,
        "__examples__",
        file.slice(0, -3) + ".typegen.ts"
      ),
      getTypegenOutput(event)
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
