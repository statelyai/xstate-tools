import * as fs from 'fs/promises';
import * as path from 'path';
import * as prettier from 'prettier';
export const writeToFetchedMachineFile = async (opts: {
  filePath: string;
  machine: any;
}) => {
  const prettierConfig = await prettier.resolveConfig(opts.filePath);
  const pathToSave =
    opts.filePath.slice(0, -path.extname(opts.filePath).length) + '.fetched.ts';

  const newMachine = { ...opts.machine, tsTypes: {} };
  // const machineFile = `
  // import { createMachine } from 'xstate';
  // const ${opts.machine.id.replaceAll(/\s/g, '')} = createMachine(${newMachine});
  // `;

  const machineFile = `
  import { createMachine } from 'xstate';
  const lightMachine = createMachine(${opts.machine});
  `;

  await fs.writeFile(
    pathToSave,
    prettier.format(machineFile, {
      ...prettierConfig,
      parser: 'typescript',
    }),
  );
};
