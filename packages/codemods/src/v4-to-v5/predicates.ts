import ts from 'typescript';
import { findDescendant } from './utils';

export function isXStateImportDeclaration(
  node: ts.Node,
): node is ts.ImportDeclaration {
  return (
    ts.isImportDeclaration(node) &&
    ts.isStringLiteral(node.moduleSpecifier) &&
    node.moduleSpecifier.text === 'xstate'
  );
}

export function isDescendantOfXStateImport(node: ts.Node): boolean {
  return Boolean(ts.findAncestor(node, isXStateImportDeclaration));
}

export function isXStateImportClause(
  node: ts.Node,
): node is ts.ImportClause & { name: ts.Identifier } {
  return Boolean(
    isDescendantOfXStateImport(node) &&
      ts.isImportClause(node) &&
      node.name &&
      ts.isIdentifier(node.name),
  );
}

export function isMachineNamedImportSpecifier(
  node: ts.Node,
): node is ts.ImportSpecifier {
  return (
    isDescendantOfXStateImport(node) &&
    ts.isImportSpecifier(node) &&
    (node.propertyName
      ? node.propertyName.text === 'Machine'
      : node.name.text === 'Machine')
  );
}

export function isMachineCallExpression(
  node: ts.Node,
): node is ts.CallExpression & { expression: ts.Identifier } {
  if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) {
    return false;
  }

  const sourceFile = node.getSourceFile();
  const namedImportSpecifier = findDescendant(
    sourceFile,
    isMachineNamedImportSpecifier,
  );

  if (!namedImportSpecifier) {
    return false;
  }

  return (
    node.expression.text ===
    (namedImportSpecifier.propertyName ?? namedImportSpecifier.name).text
  );
}

export function isMachinePropertyAccessExpression(
  node: ts.Node,
): node is ts.PropertyAccessExpression {
  if (
    !ts.isPropertyAccessExpression(node) ||
    !ts.isIdentifier(node.expression)
  ) {
    return false;
  }

  const sourceFile = node.getSourceFile();
  const xstateImportClause = findDescendant(sourceFile, isXStateImportClause);

  if (!xstateImportClause) {
    return false;
  }

  return (
    node.expression.text === xstateImportClause.name.text &&
    node.name.text === 'Machine'
  );
}
