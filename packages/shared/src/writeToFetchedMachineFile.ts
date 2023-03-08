import * as fs from 'fs/promises';
import * as path from 'path';
import * as prettier from 'prettier';
export const writeToFetchedMachineFile = async (opts: {
  filePath: string;
  configStringObject: string;
}) => {
  const prettierConfig = await prettier.resolveConfig(opts.filePath);
  const pathToSave =
    opts.filePath.slice(0, -path.extname(opts.filePath).length) + '.fetched.ts';

  // Maybe the id should be something we know up front, like fetchedMachine or something?
  const idTemp = opts.configStringObject
    .split('id":')[1]
    .split(',')[0]
    .replace(/\s*\"*/g, ''); //?
  const id = idTemp.charAt(0).toLowerCase() + idTemp.slice(1); //?

  const machineFile = `
  import { createMachine } from 'xstate';
  export const ${id} = createMachine(${opts.configStringObject});
  `;

  await fs.writeFile(
    pathToSave,
    prettier.format(machineFile, {
      ...prettierConfig,
      parser: 'typescript',
    }),
  );
};
