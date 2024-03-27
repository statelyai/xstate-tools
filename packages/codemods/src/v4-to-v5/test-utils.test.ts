import ts from 'typescript';
import { isXStateImportDeclaration } from './predicates';
import { parse } from './test-utils';
import { findDescendant } from './utils';

test('parse', () => {
  const sourceFile = parse(`import { Machine } from 'xstate'`);

  expect(ts.isSourceFile(sourceFile)).toBe(true);
  expect(
    findDescendant(sourceFile, isXStateImportDeclaration),
  ).not.toBeUndefined();
});
