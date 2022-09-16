import * as fs from 'fs/promises';
import * as path from 'path';
import * as prettier from 'prettier';
import { TypegenData } from './getTypegenData';
import { getTypegenOutput } from './getTypegenOutput';
import { removeFile } from './removeFile';

export const writeToTypegenFile = async (
  filePath: string,
  types: TypegenData[],
) => {
  const pathToSave =
    filePath.slice(0, -path.extname(filePath).length) + '.typegen.ts';

  if (!types.length) {
    await removeFile(pathToSave);
    return;
  }

  await fs.writeFile(
    pathToSave,
    prettier.format(getTypegenOutput(types), {
      ...(await prettier.resolveConfig(filePath)),
      parser: 'typescript',
    }),
  );
};
