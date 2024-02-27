import realFs from 'fs';
import * as fs from 'fs-extra';
import { produceWithPatches, type Draft } from 'immer';
import outdent from 'outdent';
import path from 'path';
import { onExit } from 'signal-exit';
import { temporaryDirectory } from 'tempy';
import typescript from 'typescript';
import { TSProjectOptions, XStateProject, createProject } from '../src/index';
import {
  ActorBlock,
  Edge,
  ExtractorDigraphDef,
  Node,
  TextEdit,
} from '../src/types';
import { uniqueId } from '../src/utils';

// it's not part of the types but it's available at runtime
// we enable this in this *test* file so it has global effect for our tests
(typescript as any).Debug.enableDebugInfo();

function toArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function assert(value: unknown): asserts value {
  if (!value) {
    throw new Error('It should not happen.');
  }
}

export const js = outdent;
export const ts = outdent;
export const tsx = outdent;

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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

type TransitionPath =
  | [type: 'always', transitionIndex: number]
  | [type: 'after', delay: string | number, transitionIndex: number]
  | [type: 'on', event: string, transitionIndex: number]
  | [type: 'onDone', transitionIndex: number]
  | [
      type: 'invoke',
      invokeIndex: number,
      event: 'onDone',
      transitionIndex: number,
    ]
  | [
      type: 'invoke',
      invokeIndex: number,
      event: 'onError',
      transitionIndex: number,
    ];

type ActionPath =
  | [..._: TransitionPath, actionIndex: number]
  | [type: 'entry', actionIndex: number]
  | [type: 'exit', actionIndex: number];

type MachineEdit =
  | { type: 'add_state'; path: string[]; name: string }
  | { type: 'remove_state'; path: string[] }
  | { type: 'rename_state'; path: string[]; name: string }
  | { type: 'reparent_state'; path: string[]; newParentPath: string[] }
  | {
      type: 'set_initial_state';
      path: string[];
      initialState: string | undefined;
    }
  | { type: 'set_state_id'; path: string[]; id: string | null }
  | {
      type: 'set_state_type';
      path: string[];
      stateType: 'normal' | 'parallel' | 'final' | 'history';
      history?: 'shallow' | 'deep';
    }
  | {
      type: 'add_transition';
      sourcePath: string[];
      targetPath: string[] | null;
      transitionPath: TransitionPath;
      reenter?: boolean | undefined;
      guard?: string;
    }
  | {
      type: 'remove_transition';
      sourcePath: string[];
      transitionPath: TransitionPath;
    }
  | {
      type: 'reanchor_transition';
      sourcePath: string[];
      newSourcePath?: string[];
      newTargetPath?: string[] | null;
      transitionPath: TransitionPath;
      newTransitionPath?: TransitionPath;
    }
  | {
      type: 'change_transition_path';
      sourcePath: string[];
      transitionPath: TransitionPath;
      newTransitionPath: TransitionPath;
    }
  | {
      type: 'mark_transition_as_external';
      sourcePath: string[];
      transitionPath: TransitionPath;
      external: boolean;
    }
  | {
      type: 'add_action';
      path: string[];
      actionPath: ActionPath;
      name: string;
    }
  | {
      type: 'remove_action';
      path: string[];
      actionPath: ActionPath;
    }
  | {
      type: 'edit_action';
      path: string[];
      actionPath: ActionPath;
      name: string;
    }
  | {
      type: 'add_guard';
      path: string[];
      transitionPath: TransitionPath;
      name: string;
    }
  | {
      type: 'remove_guard';
      path: string[];
      transitionPath: TransitionPath;
    }
  | {
      type: 'edit_guard';
      path: string[];
      transitionPath: TransitionPath;
      name: string;
    }
  | {
      type: 'add_invoke';
      path: string[];
      invokeIndex: number;
      source: string;
      id?: string;
    }
  | {
      type: 'remove_invoke';
      path: string[];
      invokeIndex: number;
    }
  | {
      type: 'edit_invoke';
      path: string[];
      invokeIndex: number;
      source?: string;
      id?: string | null;
    }
  | {
      type: 'set_description';
      statePath: string[];
      transitionPath?: TransitionPath;
      description?: string | undefined;
    };

function findNodeByStatePath(
  digraph: Draft<ExtractorDigraphDef>,
  path: string[],
) {
  let marker = digraph.nodes[digraph.root];
  let parentId = digraph.root;

  for (const segment of path) {
    const node = Object.values(digraph.nodes).find(
      (node) => node.parentId === parentId && node.data.key === segment,
    );
    assert(node);
    marker = node;
    parentId = node.uniqueId;
  }
  return marker;
}

function getEventTypeData(
  digraphDraft: Draft<ExtractorDigraphDef>,
  {
    transitionPath,
    sourcePath,
  }: {
    transitionPath: TransitionPath;
    sourcePath: string[];
  },
): Edge['data']['eventTypeData'] {
  switch (transitionPath[0]) {
    case 'on':
      return {
        type: 'named',
        eventType: transitionPath[1],
      };
    case 'always':
      return {
        type: 'always',
      };
    case 'after':
      break;
    case 'onDone':
      return {
        type: 'state.done',
      };
    case 'invoke': {
      const sourceNode = findNodeByStatePath(digraphDraft, sourcePath);
      return {
        type:
          transitionPath[2] === 'onDone'
            ? 'invocation.done'
            : 'invocation.error',
        invocationId: sourceNode.data.invoke[transitionPath[1]],
      };
    }
  }

  throw new Error('Not implemented');
}

function produceNewDigraphUsingEdit(
  digraphDraft: Draft<ExtractorDigraphDef>,
  edit: MachineEdit,
) {
  switch (edit.type) {
    case 'add_state': {
      const parent = findNodeByStatePath(digraphDraft, edit.path);
      const newNode: Node = {
        type: 'node',
        uniqueId: uniqueId(),
        parentId: parent.uniqueId,
        data: {
          key: edit.name,
          initial: undefined,
          type: 'normal',
          history: undefined,
          metaEntries: [],
          entry: [],
          exit: [],
          invoke: [],
          tags: [],
          description: undefined,
        },
      };
      digraphDraft.nodes[newNode.uniqueId] = newNode;
      break;
    }
    case 'remove_state':
      throw new Error(`Not implemented: ${edit.type}`);
    case 'rename_state': {
      const node = findNodeByStatePath(digraphDraft, edit.path);
      const oldName = node.data.key;

      node.data.key = edit.name;

      const parentNode = findNodeByStatePath(
        digraphDraft,
        edit.path.slice(0, -1),
      );

      // TODO: it would be great if `.initial` could be a uniqueId and not a resolved value
      // that would have to be changed in the Studio and adjusted in this package
      if (parentNode.data.initial === oldName) {
        parentNode.data.initial = edit.name;
      }
      break;
    }
    case 'reparent_state':
      throw new Error(`Not implemented: ${edit.type}`);
    case 'set_initial_state': {
      const node = findNodeByStatePath(digraphDraft, edit.path);
      node.data.initial = edit.initialState;
      break;
    }
    case 'set_state_id':
      // this isn't supported by the Studio anyway
      throw new Error(`Not implemented: ${edit.type}`);
    case 'set_state_type': {
      const node = findNodeByStatePath(digraphDraft, edit.path);
      node.data.type = edit.stateType;
      node.data.history = edit.history
        ? edit.history
        : edit.stateType === 'history'
        ? 'shallow'
        : undefined;
      break;
    }
    case 'add_transition':
      const sourceNode = findNodeByStatePath(digraphDraft, edit.sourcePath);
      const targetNode =
        edit.targetPath && findNodeByStatePath(digraphDraft, edit.targetPath);

      const newEdge: Edge = {
        type: 'edge',
        uniqueId: uniqueId(),
        source: sourceNode.uniqueId,
        targets: targetNode ? [targetNode.uniqueId] : [],
        data: {
          eventTypeData: getEventTypeData(digraphDraft, edit),
          actions: [],
          guard: undefined,
          description: undefined,
          metaEntries: [],
          internal:
            typeof edit.reenter === 'boolean' ? !edit.reenter : undefined,
        },
      };
      digraphDraft.edges[newEdge.uniqueId] = newEdge;
      break;
    case 'remove_transition':
    case 'reanchor_transition':
    case 'change_transition_path':
    case 'mark_transition_as_external':
    case 'add_action':
    case 'remove_action':
    case 'edit_action':
    case 'add_guard':
    case 'remove_guard':
    case 'edit_guard':
    case 'add_invoke':
    case 'remove_invoke':
    case 'edit_invoke':
      throw new Error(`Not implemented: ${edit.type}`);
    case 'set_description':
      const node = findNodeByStatePath(digraphDraft, edit.statePath);
      if (edit.transitionPath) {
        throw new Error(`Not implemented`);
      }
      node.data.description = edit.description;
      break;
  }
}

export async function createTestProject(
  cwd: string,
  {
    ts = typescript,
    xstateVersion: version,
    ...options
  }: Partial<TypeScriptTestProgramOptions & TSProjectOptions> = {},
) {
  const program = await createTestProgram(cwd, {
    ts: typescript,
    ...options,
  });
  const project = createProject(ts, program, { xstateVersion: version });
  return {
    ...project,
    editDigraph: (
      {
        fileName,
        machineIndex,
      }: {
        fileName: string;
        machineIndex: number;
      },
      edits: MachineEdit | MachineEdit[],
    ) => {
      const digraph = project.getMachinesInFile(fileName)[machineIndex][0];
      assert(digraph);
      const [, patches] = produceWithPatches(digraph, (digraphDraft) => {
        for (const edit of toArray(edits)) {
          produceNewDigraphUsingEdit(digraphDraft, edit);
        }
      });
      return project.applyPatches({
        fileName,
        machineIndex,
        // shuffle patches to make sure the order doesn't matter
        patches: shuffle(patches),
      });
    },
    applyTextEdits: async (edits: readonly TextEdit[]) => {
      const edited: Record<string, string> = {};

      for (const edit of [...edits].sort((a, b) => {
        const startA = 'range' in a ? a.range.start : a.position;
        const startB = 'range' in b ? b.range.start : b.position;
        return startB - startA;
      })) {
        const relativeFileName = path.relative(cwd, edit.fileName);
        const source =
          edited[relativeFileName] ??
          program.getSourceFile(edit.fileName)!.text;
        switch (edit.type) {
          case 'delete':
            edited[relativeFileName] =
              source.slice(0, edit.range.start) + source.slice(edit.range.end);
            break;
          case 'insert':
            edited[relativeFileName] =
              source.slice(0, edit.position) +
              edit.newText +
              source.slice(edit.position);
            break;
          case 'replace':
            edited[relativeFileName] =
              source.slice(0, edit.range.start) +
              edit.newText +
              source.slice(edit.range.end);
            break;
        }
      }

      return edited;
    },
  };
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
  extracted: ReturnType<XStateProject['getMachinesInFile']>,
) {
  return extracted.map(([digraph, errors]) => {
    if (!digraph) {
      return [digraph, errors];
    }

    const replacements = Object.fromEntries([
      ...Object.keys(digraph.blocks).map(
        (id, i) => [id, `block-${i}`] as const,
      ),
      ...Object.keys(digraph.edges).map((id, i) => [id, `edge-${i}`] as const),
      ...Object.keys(digraph.nodes).map((id, i) => [id, `state-${i}`] as const),
      ...Object.values(digraph.blocks)
        .filter((block): block is ActorBlock => block.blockType === 'actor')
        .filter((block) => block.properties.id.startsWith('inline:'))
        .map(
          (block, i) => [block.properties.id, `inline:actor-id-${i}`] as const,
        ),
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
