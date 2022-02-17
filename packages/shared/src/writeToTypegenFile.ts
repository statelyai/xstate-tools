import * as fs from "fs";
import * as prettier from "prettier";
import { promisify } from "util";
import { getTypegenOutput } from ".";

export const writeToTypegenFile = async (opts: {
  filePath: string;
  event: Parameters<typeof getTypegenOutput>[0];
}) => {
  const prettierConfig = await prettier.resolveConfig(opts.filePath);
  const pathToSave = opts.filePath.replace(
    /\.(cjs|mjs|js|tsx|ts|jsx)$/,
    ".typegen.ts",
  );

  try {
    if (opts.event.machines.some((machine) => machine.hasTypesNode)) {
      const typegenOutput = getTypegenOutput(opts.event);
      await promisify(fs.writeFile)(
        pathToSave,
        prettier.format(typegenOutput, {
          ...prettierConfig,
          parser: "typescript",
        }),
      );
    } else if (await promisify(fs.exists)(pathToSave)) {
      await promisify(fs.unlink)(pathToSave);
    }
  } catch (e) {
    console.log(e);
  }
};
