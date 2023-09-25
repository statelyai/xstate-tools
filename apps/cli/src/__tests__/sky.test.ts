import { execSync } from 'child_process';
import * as fs from 'fs';
import * as minimatch from 'minimatch';
import * as path from 'path';

describe('sky', () => {
  const examplesPath = path.resolve(__dirname, '__sky__');
  const examplesFiles = fs.readdirSync(examplesPath);

  minimatch
    .match(examplesFiles, '*.sky.ts')
    .map((file) => fs.unlinkSync(path.join(examplesPath, file)));

  execSync('yarn build', {
    cwd: __dirname,
    stdio: 'ignore',
  });

  execSync('node ../../bin/bin.js sky "./__sky__/*.ts"', {
    cwd: __dirname,
  });

  it('Should pass tsc', async () => {
    try {
      execSync(`tsc`, { cwd: examplesPath });
    } catch (e: any) {
      throw new Error(e.stdout.toString());
    }
  });
});
