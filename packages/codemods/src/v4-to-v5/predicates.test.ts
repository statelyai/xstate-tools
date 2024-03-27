import outdent from 'outdent';
import ts from 'typescript';
import {
  isDescendantOfXStateImport,
  isMachineCallExpression,
  isMachineNamedImportSpecifier,
  isMachinePropertyAccessExpression,
  isXStateImportClause,
  isXStateImportDeclaration,
} from './predicates';
import { parse } from './test-utils';
import { findDescendant } from './utils';

describe('isXStateImportDeclaration', () => {
  test.each<[code: string, expected: boolean]>([
    [`import xstate from 'xstate'`, true],
    [`import { Machine } from 'xstate'`, true],
    [`import { Machine as M } from 'xstate'`, true],
    [`import xstate from 'not-xstate'`, false],
    [`import { Machine } from 'not-xstate'`, false],
    [`import { Machine as M } from 'not-xstate'`, false],
    [`console.log('not an ImportDeclaration')`, false],
  ])('%s (%s)', (code, expected) => {
    const sourceFile = parse(code);
    const node = findDescendant(sourceFile, isXStateImportDeclaration);

    if (expected) {
      expect(node).not.toBeUndefined();
      expect(node!.kind).toBe(ts.SyntaxKind.ImportDeclaration);
    } else {
      expect(node).toBeUndefined();
    }
  });
});

describe('isDescendantOfXStateImport', () => {
  test.each<[code: string, expected: boolean]>([
    [`import xstate from 'xstate'`, true],
    [`import { Machine } from 'xstate'`, true],
    [`import { Machine as M } from 'xstate'`, true],
    [`import xstate from 'not-xstate'`, false],
    [`import { Machine } from 'not-xstate'`, false],
    [`import { Machine as M } from 'not-xstate'`, false],
  ])(`%s (%s)`, (code, expected) => {
    const sourceFile = parse(code);
    const node = findDescendant(sourceFile, isDescendantOfXStateImport);

    if (expected) {
      expect(node).not.toBeUndefined();
    } else {
      expect(node).toBeUndefined();
    }
  });
});

describe('isXStateImportClause', () => {
  test.each<[code: string, expected: boolean]>([
    [`import xstate from 'xstate'`, true],
    [`import { Machine } from 'xstate'`, false],
    [`import { Machine as M } from 'xstate'`, false],
    [`import xstate from 'not-xstate'`, false],
    [`import { Machine } from 'not-xstate'`, false],
    [`import { Machine as M } from 'not-xstate'`, false],
  ])('%s (%s)', (code, expected) => {
    const sourceFile = parse(code);
    const node = findDescendant(sourceFile, isXStateImportClause);

    if (expected) {
      expect(node).not.toBeUndefined();
      expect(node!.kind).toBe(ts.SyntaxKind.ImportClause);
    } else {
      expect(node).toBeUndefined();
    }
  });
});

describe('isMachineNamedImportSpecifier', () => {
  test.each<[code: string, expected: boolean]>([
    [`import { Machine } from 'xstate'`, true],
    [`import { Machine as M } from 'xstate'`, true],
    [`import { NotMachine } from 'xstate'`, false],
    [`import { NotMachine as Machine } from 'xstate'`, false],
    [`console.log('not an ImportSpecifier')`, false],
  ])('%s (%s)', (code, expected) => {
    const sourceFile = parse(code);
    const node = findDescendant(sourceFile, isMachineNamedImportSpecifier);

    if (expected) {
      expect(node).not.toBeUndefined();
      expect(node!.kind).toBe(ts.SyntaxKind.ImportSpecifier);
    } else {
      expect(node).toBeUndefined();
    }
  });
});

describe('isMachineCallExpression', () => {
  test.each<[code: string, expected: boolean]>([
    [
      outdent`
        import { Machine } from 'xstate'
        const machine = Machine({})
      `,
      true,
    ],
    [
      outdent`
        import { Machine as M } from 'xstate'
        const machine = M({})
      `,
      false,
    ],
    [
      outdent`
        import xstate from 'xstate'
        const machine = xstate.Machine({})
      `,
      false,
    ],
    [
      outdent`
        import { Machine } from 'not-xstate'
        const machine = Machine({})
      `,
      false,
    ],
    [
      outdent`
        function Machine() {}
        const machine = Machine({})
      `,
      false,
    ],
    [
      outdent`
        console.log('non-xstate CallExpression')
      `,
      false,
    ],
    [
      outdent`
        const str = "not a CallExpression"
      `,
      false,
    ],
  ])('%s (%s)', (code, expected) => {
    const sourceFile = parse(code);
    const node = findDescendant(sourceFile, isMachineCallExpression);

    if (expected) {
      expect(node).not.toBeUndefined();
      expect(node!.kind).toBe(ts.SyntaxKind.CallExpression);
    } else {
      expect(node).toBeUndefined();
    }
  });
});

describe('isMachinePropertyAccessExpression', () => {
  test.each<[input: string, expected: boolean]>([
    [
      outdent`
        import xstate from 'xstate'
        const machine = xstate.Machine({})
      `,
      true,
    ],
    [
      outdent`
        import xstate from 'xstate'
        const Machine = xstate.Machine
      `,
      true,
    ],
    [
      outdent`
        import { Machine } from 'xstate'
        const machine = Machine({})
      `,
      false,
    ],
    [
      outdent`
        import { Machine as M } from 'xstate'
        const machine = M({})
      `,
      false,
    ],
    [
      outdent`
        import { Machine } from 'not-xstate'
        const machine = Machine({})
      `,
      false,
    ],
    [
      outdent`
        function Machine() {}
        const machine = Machine({})
      `,
      false,
    ],
    [
      outdent`
        console.log('non-xstate PropertyAccessExpression')
      `,
      false,
    ],
    [
      outdent`
        const str = "not a CallExpression"
      `,
      false,
    ],
  ])('%s (%s)', (code, expected) => {
    const sourceFile = parse(code);
    const node = findDescendant(sourceFile, isMachinePropertyAccessExpression);

    if (expected) {
      expect(node).not.toBeUndefined();
      expect(node!.kind).toBe(ts.SyntaxKind.PropertyAccessExpression);
    } else {
      expect(node).toBeUndefined();
    }
  });
});
