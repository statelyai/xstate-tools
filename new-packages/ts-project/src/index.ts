import type {
  CallExpression,
  Expression,
  Program,
  PropertyAssignment,
  SourceFile,
} from 'typescript';

// TODO: add error location/span
type ExtractionError =
  | {
      type: 'unrecognizable_state';
      node: unknown;
    }
  | {
      type: 'unrecognizable_state_element';
      node: unknown;
    }
  | {
      type: 'property_key_no_roundtrip';
      node: unknown;
    };

interface ExtractionContext {
  errors: ExtractionError[];
}

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

function getPropertyKey(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  prop: PropertyAssignment,
) {
  if (ts.isIdentifier(prop.name)) {
    return ts.idText(prop.name);
  }
  if (
    ts.isStringLiteral(prop.name) ||
    ts.isNoSubstitutionTemplateLiteral(prop.name)
  ) {
    return prop.name.text;
  }
  if (ts.isNumericLiteral(prop.name)) {
    // `.getText()` returns original text whereas `.text` on numeric literals return `(+originalText).toString()`
    // for big ints this loses precision or might even return `'Infinity'`
    const text = prop.name.getText();
    if (text !== prop.name.text) {
      ctx.errors.push({
        type: 'property_key_no_roundtrip',
        node: prop.name,
      });
    }
    return text;
  }
  if (ts.isComputedPropertyName(prop.name)) {
    return;
  }
  if (ts.isPrivateIdentifier(prop.name)) {
    return;
  }
  prop.name satisfies never;
}

function extractState(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  state: Expression | undefined,
) {
  const result: Record<string, unknown> = {};

  if (!state) {
    return result;
  }

  if (!ts.isObjectLiteralExpression(state)) {
    ctx.errors.push({
      type: 'unrecognizable_state',
      node: state,
    });
    return result;
  }

  for (const prop of state.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = getPropertyKey(ctx, ts, prop);
      continue;
    }

    if (ts.isShorthandPropertyAssignment(prop)) {
      ctx.errors.push({
        type: 'unrecognizable_state_element',
        node: prop,
      });
      continue;
    }
    if (ts.isSpreadAssignment(prop)) {
      ctx.errors.push({
        type: 'unrecognizable_state_element',
        node: prop,
      });
      continue;
    }
    if (
      ts.isMethodDeclaration(prop) ||
      ts.isGetAccessorDeclaration(prop) ||
      ts.isSetAccessorDeclaration(prop)
    ) {
      ctx.errors.push({
        type: 'unrecognizable_state_element',
        node: prop,
      });
      continue;
    }

    prop satisfies never;
  }
}

function extractMachineConfig(
  ts: typeof import('typescript'),
  createMachineCall: CallExpression,
) {
  const ctx: ExtractionContext = {
    errors: [],
  };
  const rootState = createMachineCall.arguments[0];
  return [extractState(ctx, ts, rootState), ctx.errors] as const;
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
      return findCreateMachineCalls(ts, sourceFile).map((call) =>
        extractMachineConfig(ts, call),
      );
    },
  };
}

export type XStateProject = ReturnType<typeof createProject>;
