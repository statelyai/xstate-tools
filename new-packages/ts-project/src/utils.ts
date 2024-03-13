import type {
  CallExpression,
  Expression,
  ObjectLiteralElementLike,
  ObjectLiteralExpression,
  PropertyAssignment,
} from 'typescript';
import { AstPath, ExtractionContext, JsonObject, JsonValue } from './types';

export function first<T>(arr: readonly T[] | undefined): T | undefined {
  return arr?.length ? arr[0] : undefined;
}

export function last<T>(arr: readonly T[] | undefined): T | undefined {
  return arr?.length ? arr[arr.length - 1] : undefined;
}

export function assert(condition: unknown): asserts condition {
  if (!condition) {
    throw new Error('Assertion failed');
  }
}

export function assertUnreachable(): never {
  throw new Error('It should be unreachable');
}

export function invert(obj: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(obj)) {
    result[obj[key]] = key;
  }
  return result;
}

function enterAstPathSegment(ctx: ExtractionContext, segment: AstPath[number]) {
  ctx.currentAstPath.push(segment);
}

function exitAstPathSegment(ctx: ExtractionContext) {
  ctx.currentAstPath.pop();
}

export function withAstPathSegment<T>(
  ctx: ExtractionContext,
  segment: AstPath[number],
  cb: () => T,
): T {
  try {
    enterAstPathSegment(ctx, segment);
    return cb();
  } finally {
    exitAstPathSegment(ctx);
  }
}

export const uniqueId = () => {
  return Math.random().toString(36).substring(2);
};

function getLiteralText(
  ctx: ExtractionContext | undefined,
  ts: typeof import('typescript'),
  node: Expression,
) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isNumericLiteral(node)) {
    // `.getText()` returns original text whereas `.text` on numeric literals return `(+originalText).toString()`
    // for big ints this loses precision or might even return `'Infinity'`
    const text = node.getText();
    if (text !== node.text) {
      ctx?.errors.push({
        type: 'property_key_no_roundtrip',
      });
    }
    return text;
  }
}

export function getPropertyKey(
  ctx: ExtractionContext | undefined,
  ts: typeof import('typescript'),
  prop: PropertyAssignment,
) {
  if (ts.isIdentifier(prop.name)) {
    return ts.idText(prop.name);
  }
  if (ts.isExpression(prop.name)) {
    return getLiteralText(ctx, ts, prop.name);
  }
  if (ts.isComputedPropertyName(prop.name)) {
    const text = getLiteralText(ctx, ts, prop.name.expression);
    if (typeof text === 'string') {
      return text;
    }
    ctx?.errors.push({
      type: 'property_key_unhandled',
      propertyKind: 'computed',
    });
    return;
  }
  if (ts.isPrivateIdentifier(prop.name)) {
    ctx?.errors.push({
      type: 'property_key_unhandled',
      propertyKind: 'private',
    });
    return;
  }
  prop.name satisfies never;
}

export const isUndefined = (
  ts: typeof import('typescript'),
  prop: Expression,
) => ts.isIdentifier(prop) && ts.idText(prop) === 'undefined';

export function getJsonValue(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  prop: Expression,
): JsonValue | undefined {
  if (ts.isStringLiteralLike(prop)) {
    return prop.text;
  }
  if (ts.isNumericLiteral(prop)) {
    return +prop.text;
  }
  if (prop.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (prop.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (prop.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }
  // TODO: set a strategy here. Ignore the whole array if an items can't be extracted or try to extract as much as possible?
  if (ts.isArrayLiteralExpression(prop)) {
    const arr = [];
    for (const elem of prop.elements) {
      const value = getJsonValue(ctx, ts, elem);
      if (value === undefined) {
        // TODO: raise error
        return;
      }
      arr.push(value);
    }
    return arr;
  }
  if (ts.isObjectLiteralExpression(prop)) {
    return getJsonObject(ctx, ts, prop);
  }
}

export const getJsonObject = (
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  prop: ObjectLiteralExpression,
) => {
  const obj: JsonObject = {};
  for (const p of prop.properties) {
    if (ts.isPropertyAssignment(p)) {
      const key = getPropertyKey(ctx, ts, p);
      if (key) {
        const value = getJsonValue(ctx, ts, p.initializer);
        if (value === undefined) {
          // TODO: raise error
          return;
        }
        obj[key] = value;
      }
    }
  }
  return obj;
};

export function mapMaybeArrayElements<T>(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  expression: Expression,
  cb: (element: Expression, index: number) => T,
): T[] {
  if (ts.isArrayLiteralExpression(expression)) {
    return expression.elements.map((element, index) => {
      return withAstPathSegment(ctx, index, () => cb(element, index));
    });
  } else {
    return [cb(expression, 0)];
  }
}

export function everyDefined<T>(arr: T[]): arr is NonNullable<T>[] {
  return arr.every((item) => item !== undefined);
}

export function findLast<T>(
  arr: readonly T[],
  predicate: (item: T) => boolean,
) {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      return arr[i];
    }
  }
}

export function findProperty(
  ctx: ExtractionContext | undefined,
  ts: typeof import('typescript'),
  obj: ObjectLiteralExpression,
  key: string,
): PropertyAssignment | undefined {
  for (let i = obj.properties.length - 1; i >= 0; i--) {
    const prop = obj.properties[i];
    if (
      ts.isPropertyAssignment(prop) &&
      getPropertyKey(ctx, ts, prop) === key
    ) {
      return prop;
    }
  }
}

export function forEachStaticProperty(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  obj: ObjectLiteralExpression,
  cb: (prop: PropertyAssignment, key: string) => void,
) {
  const seen = new Set<string>();
  for (let i = obj.properties.length - 1; i >= 0; i--) {
    const prop = obj.properties[i];

    if (!ts.isPropertyAssignment(prop)) {
      ctx.errors.push({ type: 'property_unhandled' });
      continue;
    }
    const key = getPropertyKey(ctx, ts, prop);

    if (typeof key !== 'string') {
      // error should already be reported by `getPropertyKey`
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    withAstPathSegment(ctx, i, () => cb(prop, key));
  }
}

export function findNodeByAstPath(
  ts: typeof import('typescript'),
  call: CallExpression,
  path: AstPath,
): Expression {
  if (!call.arguments[0]) {
    throw new Error('Invalid node');
  }

  let current = call.arguments[0];

  console.log(268, path);
  for (const segment of path) {
    if (ts.isObjectLiteralExpression(current)) {
      const retrieved = current.properties[segment];
      if (!retrieved || !ts.isPropertyAssignment(retrieved)) {
        throw new Error('Invalid node');
      }
      current = retrieved.initializer;
      continue;
    }
    if (ts.isArrayLiteralExpression(current)) {
      const retrieved = current.elements[segment];
      if (!retrieved) {
        throw new Error('Invalid node');
      }
      current = retrieved;
      continue;
    }
    throw new Error('Invalid node');
  }
  return current;
}
