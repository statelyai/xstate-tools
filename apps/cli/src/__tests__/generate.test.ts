import { execSync } from 'child_process';
import * as path from 'path';

describe('generate', () => {
  const examplesPath = path.resolve(__dirname, '__liveMachines__');

  execSync('yarn build', {
    cwd: __dirname,
    stdio: 'ignore',
  });

  execSync(
    'node ../../bin/bin.js generate "./__liveMachines__/toggleMachine.ts"',
    { cwd: __dirname },
  );

  it('Should pass tsc', async () => {
    try {
      execSync(`tsc`, { cwd: examplesPath });
    } catch (e: any) {
      throw new Error(e.stdout.toString());
    }
  });
});
