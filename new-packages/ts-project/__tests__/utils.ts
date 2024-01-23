import realFs from 'fs';
import * as fs from 'fs-extra';
import outdent from 'outdent';
import path from 'path';
import { onExit } from 'signal-exit';
import { temporaryDirectory } from 'tempy';
import typescript from 'typescript';
import { XStateProject, createProject } from '../src/index';
import { ActorBlock } from '../src/types';

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

  const host = ts.createCompilerHost(options, true);
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

function replaceUniqueIdsRecursively(
  input: unknown,
  replacements: Record<string, string>,
): unknown {
  if (!input) {
    return input;
  }
  if (typeof input === 'string') {
    return replacements[input] ?? input;
  }
  if (Array.isArray(input)) {
    return input.map((item) => replaceUniqueIdsRecursively(item, replacements));
  }
  if (typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        replaceUniqueIdsRecursively(value, replacements),
      ]),
    );
  }
  return input;
}

export function replaceUniqueIds(
  extracted: ReturnType<XStateProject['extractMachines']>,
) {
  return extracted.map(([digraph, errors]) => {
    if (!digraph) {
      return [digraph, errors];
    }

    const replacements = Object.fromEntries([
      ...Object.keys(digraph.blocks).map(
        (id, i) => [id, `block-${i}`] as const,
      ),
      ...Object.values(digraph.blocks)
        .filter((block): block is ActorBlock => block.blockType === 'actor')
        .filter((block) => block.properties.id.startsWith('inline:'))
        .map(
          (block, i) => [block.properties.id, `inline:actor-id-${i}`] as const,
        ),
      ...Object.keys(digraph.edges).map((id, i) => [id, `edge-${i}`] as const),
      ...Object.keys(digraph.nodes).map((id, i) => [id, `state-${i}`] as const),

      ...Object.keys(digraph.implementations.actions)
        .filter((key) => key.startsWith('inline:'))
        .map((id, i) => [id, `inline:action-${i}`] as const),
      ...Object.keys(digraph.implementations.actors)
        .filter((key) => key.startsWith('inline:'))
        .map((id, i) => [id, `inline:actor-${i}`] as const),
      ...Object.keys(digraph.implementations.guards)
        .filter((key) => key.startsWith('inline:'))
        .map((id, i) => [id, `inline:guard-${i}`] as const),
    ]);

    return [
      replaceUniqueIdsRecursively(
        {
          ...digraph,
          blocks: Object.fromEntries(
            Object.entries(digraph.blocks).map(([id, block]) => [
              replacements[id],
              block,
            ]),
          ),
          edges: Object.fromEntries(
            Object.entries(digraph.edges).map(([id, edge]) => [
              replacements[id],
              edge,
            ]),
          ),
          nodes: Object.fromEntries(
            Object.entries(digraph.nodes).map(([id, node]) => [
              replacements[id],
              node,
            ]),
          ),
          implementations: {
            actions: Object.fromEntries(
              Object.entries(digraph.implementations.actions).map(
                ([id, action]) => [replacements[id] ?? id, action],
              ),
            ),
            actors: Object.fromEntries(
              Object.entries(digraph.implementations.actors).map(
                ([id, actor]) => [replacements[id] ?? id, actor],
              ),
            ),
            guards: Object.fromEntries(
              Object.entries(digraph.implementations.guards).map(
                ([id, guard]) => [replacements[id] ?? id, guard],
              ),
            ),
          },
        },
        replacements,
      ),
      errors,
    ];
  });
}
