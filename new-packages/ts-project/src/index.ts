import type { Patch } from 'immer';
import type { CallExpression, Program, SourceFile } from 'typescript';
import { extractState } from './state';
import type {
  ExtractionContext,
  ExtractionError,
  ExtractorDigraphDef,
  ProjectMachineState,
  Range,
  TextEdit,
  TreeNode,
  XStateVersion,
} from './types';

function findCreateMachineCalls(
  ts: typeof import('typescript'),
  sourceFile: SourceFile,
) {
  const createMachineCalls: CallExpression[] = [];

  sourceFile.forEachChild(function visitor(node) {
    if (ts.isTypeNode(node)) {
      return;
    }

    if (
      ts.isCallExpression(node) &&
      ((ts.isIdentifier(node.expression) &&
        ts.idText(node.expression) === 'createMachine') ||
        (ts.isPropertyAccessExpression(node.expression) &&
          ts.isIdentifier(node.expression.name) &&
          ts.idText(node.expression.name) === 'createMachine'))
    ) {
      createMachineCalls.push(node);
    }
    node.forEachChild(visitor);
  });

  return createMachineCalls;
}

function resolvePathOrigin(
  ctx: ExtractionContext,
  sourceId: string,
  origin: string | undefined,
): TreeNode | undefined {
  if (origin === undefined) {
    return;
  }
  if (origin === '') {
    return ctx.treeNodes[sourceId];
  }
  if (origin[0] === '#') {
    const originId = ctx.idMap[origin.slice(1)];
    return ctx.treeNodes[originId];
  }

  const source = ctx.treeNodes[sourceId];
  if (!source.parentId) {
    return;
  }
  const parent = ctx.treeNodes[source.parentId];
  return parent.children[origin];
}

function resolveTargetId(
  ctx: ExtractionContext,
  sourceId: string,
  target: string,
) {
  // TODO: handle escaping once we land it in XState
  const [origin, ...path] = target.split('.');
  const resolvedOrigin = resolvePathOrigin(ctx, sourceId, origin);
  if (!resolvedOrigin) {
    ctx.errors.push({
      type: 'transition_target_unresolved',
    });
    return;
  }

  let marker = resolvedOrigin;
  let segment: string | undefined;
  while ((segment = path.shift())) {
    marker = marker.children[segment];
    if (!marker) {
      ctx.errors.push({
        type: 'transition_target_unresolved',
      });
      return;
    }
  }
  return marker.uniqueId;
}

function resolveTargets(ctx: ExtractionContext) {
  for (const [edgeId, edgeTargets] of Object.entries(ctx.originalTargets)) {
    for (const edgeTarget of edgeTargets) {
      const sourceId = ctx.digraph.edges[edgeId].source;
      const resolvedTargetId = resolveTargetId(ctx, sourceId, edgeTarget);
      if (!resolvedTargetId) {
        ctx.errors.push({
          type: 'transition_property_unhandled',
        });
        continue;
      }
      ctx.digraph.edges[edgeId].targets.push(resolvedTargetId);
    }
  }
}

function extractMachineConfig(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  createMachineCall: CallExpression,
): readonly [ExtractorDigraphDef | undefined, ExtractionError[]] {
  const rootState = createMachineCall.arguments[0];
  const rootNode = extractState(ctx, ts, rootState, {
    parentId: undefined,
    key: '(machine)', // acts as a default that might be overriden by `rootState.id`
  });

  if (!rootNode) {
    return [undefined, ctx.errors];
  }

  resolveTargets(ctx);

  return [
    {
      root: rootNode.uniqueId,
      blocks: ctx.digraph.blocks,
      nodes: ctx.digraph.nodes,
      edges: ctx.digraph.edges,
      implementations: ctx.digraph.implementations,
      data: ctx.digraph.data,
    },
    ctx.errors,
  ];
}

export interface TSProjectOptions {
  xstateVersion?: XStateVersion | undefined;
}

function extractProjectMachine(
  host: ProjectHost,
  sourceFile: SourceFile,
  call: CallExpression,
  oldState: ProjectMachineState | undefined,
) {
  const ctx: ExtractionContext = {
    sourceFile,
    xstateVersion: host.xstateVersion,
    oldState,
    errors: [],
    digraph: {
      nodes: {},
      edges: {},
      blocks: {},
      implementations: {
        actions: {},
        actors: {},
        guards: {},
      },
      data: {
        context: {},
      },
    },
    treeNodes: {},
    idMap: {},
    originalTargets: {},
    currentAstPath: [],
    astPaths: {
      nodes: {},
      edges: {},
    },
  };
  const [digraph, errors] = extractMachineConfig(ctx, host.ts, call);
  return {
    digraph,
    errors,
    astPaths: ctx.astPaths,
  };
}

function createProjectMachine({
  host,
  fileName,
  machineIndex,
}: {
  host: ProjectHost;
  fileName: string;
  machineIndex: number;
}) {
  let state: ProjectMachineState | undefined;
  return {
    fileName,
    machineIndex,
    getDigraph() {
      const sourceFile = host.getCurrentProgram().getSourceFile(fileName);

      if (!sourceFile) {
        throw new Error('File not found');
      }

      const createMachineCall = findCreateMachineCalls(host.ts, sourceFile)[
        machineIndex
      ];

      if (!createMachineCall) {
        throw new Error('Machine not found');
      }

      state = extractProjectMachine(host, sourceFile, createMachineCall, state);
      return [state.digraph, state.errors] as const;
    },
    applyPatches(patches: Patch[]): TextEdit[] {
      return [];
    },
  };
}

type ProjectMachine = ReturnType<typeof createProjectMachine>;

interface ProjectHost {
  ts: typeof import('typescript');
  xstateVersion: XStateVersion;
  getCurrentProgram: () => Program;
}

export function createProject(
  ts: typeof import('typescript'),
  tsProgram: Program,
  { xstateVersion = '5' }: TSProjectOptions = {},
) {
  const projectMachines: Record<string, ProjectMachine[]> = {};

  let currentProgram = tsProgram;

  const host: ProjectHost = {
    ts,
    xstateVersion,
    getCurrentProgram() {
      return currentProgram;
    },
  };

  return {
    findMachines: (fileName: string): Range[] => {
      const sourceFile = currentProgram.getSourceFile(fileName);
      if (!sourceFile) {
        return [];
      }
      return findCreateMachineCalls(ts, sourceFile).map((call) => {
        return {
          start: sourceFile.getLineAndCharacterOfPosition(call.getStart()),
          end: sourceFile.getLineAndCharacterOfPosition(call.getEnd()),
        };
      });
    },
    getMachinesInFile(fileName: string) {
      const existing = projectMachines[fileName];
      if (existing) {
        return existing.map((machine) => machine.getDigraph());
      }
      const sourceFile = currentProgram.getSourceFile(fileName);
      if (!sourceFile) {
        return [];
      }
      const calls = findCreateMachineCalls(ts, sourceFile);
      const created = calls.map((call, machineIndex) =>
        createProjectMachine({ host, fileName, machineIndex }),
      );
      projectMachines[fileName] = created;
      return created.map((machine) => machine.getDigraph());
    },
    applyPatches({
      fileName,
      machineIndex,
      patches,
    }: {
      fileName: string;
      machineIndex: number;
      patches: Patch[];
    }): TextEdit[] {
      const machine = projectMachines[fileName]?.[machineIndex];
      if (!machine) {
        throw new Error('Machine not found');
      }
      return machine.applyPatches(patches);
    },
    updateTsProgram(tsProgram: Program) {
      currentProgram = tsProgram;
    },
  };
}

export type XStateProject = ReturnType<typeof createProject>;
export { ExtractorDigraphDef, Patch, TextEdit };
