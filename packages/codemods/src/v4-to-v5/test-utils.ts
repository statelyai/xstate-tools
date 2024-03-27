import ts from 'typescript';

/**
 * Parse a string of code into a TypeScript `SourceFile` node.
 */
export function parse(code: string, fileName: string = 'code.ts') {
  return ts.createSourceFile(fileName, code, ts.ScriptTarget.Latest, true);
}
