import ts, { factory } from 'typescript';
import { findDescendant } from './utils';

describe('findDescendant', () => {
  test('finds a descendant node that matches the predicate', () => {
    const stringLiteral = factory.createStringLiteral('Hello, world!');
    const node = factory.createVariableStatement(
      [],
      factory.createVariableDeclarationList([
        factory.createVariableDeclaration(
          'variable',
          undefined,
          undefined,
          stringLiteral,
        ),
      ]),
    );

    expect(findDescendant(node, ts.isStringLiteral)).toBe(stringLiteral);
  });

  test('root node is returned if it matches the predicate', () => {
    const node = factory.createNumericLiteral(69);

    expect(findDescendant(node, ts.isNumericLiteral)).toBe(node);
  });

  test('returns undefined if no descendant matches predicate', () => {
    const node = factory.createNumericLiteral(69);

    expect(findDescendant(node, ts.isStringLiteral)).toBeUndefined();
  });
});
