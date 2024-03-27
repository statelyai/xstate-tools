import ts from 'typescript';

/**
 * Finds a descendant node that matches `predicate`.
 *
 * If `predicate` returns a type predicate, the return type will be narrowed to
 * that type.
 *
 * @example
 * import ts from 'typescript';
 *
 * const code = "const text = 'Hello, world!'";
 * const sourceFile = ts.createSourceFile(
 *   'file.ts',
 *   code,
 *   ts.ScriptTarget.Latest,
 *   true,
 * );
 * const stringLiteral = findDescendant(sourceFile, ts.isStringLiteral);
 *
 * console.log(stringLiteral?.text); // "Hello, world!"
 */
export function findDescendant<Node extends ts.Node>(
  node: ts.Node,
  predicate: (node: ts.Node) => node is Node,
): Node | undefined;
export function findDescendant(
  node: ts.Node,
  predicate: (node: ts.Node) => boolean,
): ts.Node | undefined;
export function findDescendant(
  node: ts.Node,
  predicate: (node: ts.Node) => boolean,
): ts.Node | undefined {
  if (predicate(node)) {
    return node;
  }

  return ts.forEachChild(node, (child) => findDescendant(child, predicate));
}
