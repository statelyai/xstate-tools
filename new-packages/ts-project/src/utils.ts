import { type Expression, type PropertyAssignment } from 'typescript';
import { ExtractionContext, JsonItem } from './types';

export const uniqueId = () => {
  return Math.random().toString(36).substring(2);
};

export function getPropertyKey(
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
      });
    }
    return text;
  }
  if (ts.isComputedPropertyName(prop.name)) {
    ctx.errors.push({
      type: 'property_key_unhandled',
      propertyKind: 'computed',
    });
    return;
  }
  if (ts.isPrivateIdentifier(prop.name)) {
    ctx.errors.push({
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
): JsonItem | undefined {
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
    const out = [];
    for (const elem of prop.elements) {
      const value = getJsonValue(ctx, ts, elem);
      if (value === undefined) {
        return;
      }
      out.push(value);
    }
    return out;
  }
  if (ts.isObjectLiteralExpression(prop)) {
    const out: Record<string, any> = {};
    for (const p of prop.properties) {
      if (ts.isPropertyAssignment(p)) {
        const key = getPropertyKey(ctx, ts, p);
        if (key) {
          out[key] = getJsonValue(ctx, ts, p.initializer);
        }
      }
    }
    return out;
  }
}
