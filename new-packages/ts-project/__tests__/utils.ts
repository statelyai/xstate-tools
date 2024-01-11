import realFs from 'fs';
import * as fs from 'fs-extra';
import outdent from 'outdent';
import path from 'path';
import { onExit } from 'signal-exit';
import { temporaryDirectory } from 'tempy';
import typescript from 'typescript';
import { createProject } from '../src/index';

export const js = outdent;
export const ts = outdent;
export const tsx = outdent;

type Fixture = {
  [key: string]: string | { kind: 'symlink'; path: string };
};

let createdTemps: string[] = [];

onExit(() => {
  createdTemps.forEach((dir) => fs.removeSync(dir));
});

function tempdir() {
  const dir = fs.realpathSync(temporaryDirectory());
  createdTemps.push(dir);
  return dir;
}

// basically replicating https://github.com/nodejs/node/blob/72f9c53c0f5cc03000f9a4eb1cf31f43e1d30b89/lib/fs.js#L1163-L1174
// for some reason the builtin auto-detection doesn't work, the code probably doesn't land go into that logic or something
async function getSymlinkType(targetPath: string): Promise<'dir' | 'file'> {
  const stat = await fs.stat(targetPath);
  return stat.isDirectory() ? 'dir' : 'file';
}

export async function testdir(dir: Fixture) {
  const temp = realFs.realpathSync.native(tempdir());
  await Promise.all(
    Object.keys(dir).map(async (filename) => {
      const output = dir[filename];
      const fullPath = path.join(temp, filename);
      if (typeof output === 'string') {
        await fs.outputFile(fullPath, output);
      } else {
        const dir = path.dirname(fullPath);
        await fs.ensureDir(dir);
        const targetPath = path.resolve(temp, output.path);
        const symlinkType = await getSymlinkType(targetPath);
        await fs.symlink(targetPath, fullPath, symlinkType);
      }
    }),
  );
  return temp;
}

interface TypeScriptTestProgramOptions {
  ts: typeof typescript;
  configFileName?: string;
}

async function createTestProgram(
  cwd: string,
  {
    ts = typescript,
    configFileName = 'tsconfig.json',
  }: TypeScriptTestProgramOptions,
) {
  const tsConfigPath = path.join(cwd, 'tsconfig.json');
  const configFileContents = await fs.readFile(tsConfigPath, 'utf8');
  const jsonResult = ts.parseConfigFileTextToJson(
    tsConfigPath,
    configFileContents,
  );

  if (jsonResult.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(jsonResult.error.messageText, '\n'),
    );
  }

  const { fileNames, options, errors } = ts.parseJsonConfigFileContent(
    jsonResult.config,
    ts.sys,
    cwd,
    undefined,
    tsConfigPath,
  );

  if (errors.length) {
    throw new Error(
      errors
        .map((diagnostic) =>
          ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
        )
        .join('\n'),
    );
  }

  const host = ts.createCompilerHost(options);
  host.getCurrentDirectory = () => cwd;
  return ts.createProgram(fileNames, options, host);
}

export async function createTestProject(
  cwd: string,
  { ts = typescript, ...options }: Partial<TypeScriptTestProgramOptions> = {},
) {
  const program = await createTestProgram(cwd, {
    ts: typescript,
    ...options,
  });
  return createProject(ts, program);
}
