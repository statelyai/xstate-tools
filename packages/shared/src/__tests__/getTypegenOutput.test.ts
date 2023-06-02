import { extractMachinesFromFile } from '@xstate/machine-extractor';
import * as fs from 'fs';
import * as fsP from 'fs/promises';
import * as path from 'path';
import { format } from 'prettier';
import { getTypegenData, getTypegenOutput } from '..';

const examplesPath = path.resolve(__dirname, '__examples__');

describe('getTypegenOutput', () => {
  fs.readdirSync(examplesPath).forEach((file) => {
    if (file.includes('.typegen.')) {
      return;
    }
    const runTest = async () => {
      const filePath = path.join(examplesPath, file);
      const content = await fsP.readFile(filePath, 'utf8');
      const extracted = extractMachinesFromFile(content);

      if (!extracted) {
        throw new Error('No machines found in the file');
      }

      const types = extracted.machines.map((parseResult, index) => {
        if (!parseResult) {
          throw new Error(`Machine at index ${index} couldn't be extracted`);
        }
        return getTypegenData(path.basename(filePath), index, parseResult);
      });

      expect(
        format(getTypegenOutput(types), { parser: 'typescript' }),
      ).toMatchSnapshot();
    };

    const extensionlessFile = file.slice(0, -path.extname(file).length);

    if (/\.only$/.test(extensionlessFile)) {
      // preserve original test name
      it.only(extensionlessFile.replace(/\.only$/, ''), runTest);
    } else {
      it(extensionlessFile, runTest);
    }
  });
});
