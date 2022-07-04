import * as fs from "fs";
import * as fsP from "fs/promises";
import * as path from "path";
import { format } from "prettier";
import {
  getDocumentValidationsResults,
  getTypegenOutput,
  makeXStateUpdateEvent,
} from "..";

const examplesPath = path.resolve(__dirname, "__examples__");

describe("getTypegenOutput", () => {
  fs.readdirSync(examplesPath).forEach((file) => {
    (file.includes(".only.") ? it.only : it)(
      file.slice(0, -path.extname(file).length),
      async () => {
        const content = await fsP.readFile(
          path.join(examplesPath, file),
          "utf8"
        );

        const event = makeXStateUpdateEvent(
          // URI doesn't matter here
          "",
          getDocumentValidationsResults(content)
        );

        expect(
          format(getTypegenOutput(event), { parser: "typescript" })
        ).toMatchSnapshot();
      }
    );
  });
});
