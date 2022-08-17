import * as fs from 'fs/promises';
import * as path from 'path';
import * as prettier from 'prettier';
import { getTypegenOutput } from './getTypegenOutput';

export const writeToTypegenFile = async (opts: {
  filePath: string;
  event: Parameters<typeof getTypegenOutput>[0];
}) => {
  const prettierConfig = await prettier.resolveConfig(opts.filePath);
  const pathToSave =
    opts.filePath.slice(0, -path.extname(opts.filePath).length) + '.typegen.ts';

  if (opts.event.machines.some((machine) => machine.hasTypesNode)) {
    const typegenOutput = getTypegenOutput(opts.event);
    await fs.writeFile(
      pathToSave,
      prettier.format(typegenOutput, {
        ...prettierConfig,
        parser: 'typescript',
      }),
    );
  } else {
    try {
      await fs.unlink(pathToSave);
    } catch (e: any) {
      if (e?.code === 'ENOENT') {
        return;
      }
      throw e;
    }
  }
};
