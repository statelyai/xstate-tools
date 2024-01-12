import type { PropertyAssignment } from 'typescript';
import { ExtractionContext } from './types';

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
