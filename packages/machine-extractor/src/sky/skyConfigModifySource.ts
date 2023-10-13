import * as fs from 'fs/promises';
import * as path from 'path';
import * as prettier from 'prettier';
import * as recast from 'recast';
import * as babelTs from 'recast/parsers/babel-ts';
import { ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES } from './skyConfigUtils';

export const modifySkyConfigSource = async (opts: { filePath: string }) => {
  const fileContents = await fs.readFile(opts.filePath, 'utf8');
  const ast = recast.parse(fileContents, {
    parser: babelTs,
  });
  const b = recast.types.builders;
  const importIdentifier = 'skyConfig';
  const name = path
    .basename(opts.filePath)
    .slice(0, -path.extname(opts.filePath).length);
  const importSource = `./${name}.sky`;

  // Check if an import for SomeModule already exists
  let isImportPresent = false;
  recast.visit(ast, {
    visitImportDeclaration(path) {
      const node = path.node;
      if (node.source.value === importSource) {
        node.specifiers?.forEach((specifier) => {
          if (
            specifier.type === 'ImportSpecifier' &&
            specifier.imported.name === importIdentifier
          ) {
            isImportPresent = true;
          }
        });
      }
      return false; // Stop traversing
    },
  });

  // Add the import if it's not already present
  if (!isImportPresent) {
    const importDeclaration = b.importDeclaration(
      [b.importSpecifier(b.identifier(importIdentifier))],
      b.stringLiteral(importSource),
    );

    // Add the import at the top of the file
    ast.program.body.unshift(importDeclaration);

    recast.visit(ast, {
      visitCallExpression(path) {
        const node = path.node;
        if (
          node.callee.type === 'Identifier' &&
          ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES.includes(node.callee.name)
        ) {
          const args = node.arguments;
          const hasSkyConfig = args.some((arg) => {
            return arg.type === 'Identifier' && arg.name === importIdentifier;
          });
          if (!hasSkyConfig) {
            args.push(b.identifier(importIdentifier));
          }
        }
        return false;
      },
    });

    const output = recast.print(ast).code;
    const prettierConfig = await prettier.resolveConfig(opts.filePath);

    await fs.writeFile(
      opts.filePath,
      prettier.format(output, {
        ...prettierConfig,
        parser: 'typescript',
      }),
    );
  }
};
