import type { CallExpression, Program, SourceFile } from 'typescript';
import { extractState } from './state';
import {
  ExtractionContext,
  ExtractionError,
  ExtractorDigraphDef,
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

function extractMachineConfig(
  ts: typeof import('typescript'),
  createMachineCall: CallExpression,
): [ExtractorDigraphDef, ExtractionError[]] {
  const ctx: ExtractionContext = {
    errors: [],
  };
  const rootState = createMachineCall.arguments[0];
  const nodes = {};
  const edges = {};
  extractState(ctx, ts, rootState, nodes);
  return [
    {
      nodes,
      edges: {},
    },
    ctx.errors,
  ] as const;
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
        return extractMachineConfig(ts, call);
      });
    },
  };
}

export type XStateProject = ReturnType<typeof createProject>;
