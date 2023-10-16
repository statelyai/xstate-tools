import { extractMachinesFromFile } from '@xstate/machine-extractor';
import {
  TypegenData,
  getTsTypesEdits,
  getTypegenData,
  getTypegenOutput,
  processFileEdits,
} from '@xstate/tools-shared';
import 'dotenv/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getPrettierInstance } from '../utils';

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

const writeToTypegenFile = async (
  typegenUri: string,
  types: TypegenData[],
  { cwd }: { cwd: string },
) => {
  const prettierInstance = getPrettierInstance(cwd);
  await fs.writeFile(
    typegenUri,
    // // Prettier v3 returns a promise
    await prettierInstance.format(getTypegenOutput(types), {
      ...(await prettierInstance.resolveConfig(typegenUri)),
      parser: 'typescript',
    }),
  );
};

export const writeToFiles = async (
  uriArray: string[],
  { cwd }: { cwd: string },
) => {
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

        const edits = getTsTypesEdits(types);
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
