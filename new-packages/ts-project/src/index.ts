import type { CallExpression, Program, SourceFile } from 'typescript';
import { extractState } from './state';
import {
  ExtractionContext,
  ExtractionError,
  ExtractorDigraphDef,
  TreeNode,
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
  ts: typeof import('typescript'),
  createMachineCall: CallExpression,
  sourceFile: SourceFile,
): readonly [ExtractorDigraphDef | undefined, ExtractionError[]] {
  const ctx: ExtractionContext = {
    sourceFile,
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
  };

  const rootState = createMachineCall.arguments[0];
  const rootNode = extractState(ctx, ts, rootState, undefined);

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

export function createProject(
  ts: typeof import('typescript'),
  tsProgram: Program,
) {
  return {
    extractMachines(fileName: string) {
      const sourceFile = tsProgram.getSourceFile(fileName);
      if (!sourceFile) {
        return [];
      }
      return findCreateMachineCalls(ts, sourceFile).map((call) => {
        return extractMachineConfig(ts, call, sourceFile);
      });
    },
  };
}

export type XStateProject = ReturnType<typeof createProject>;
