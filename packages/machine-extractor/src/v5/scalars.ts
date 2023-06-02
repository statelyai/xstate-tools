import * as t from '@babel/types';
import { createParser } from './createParser';
import {
  maybeIdentifierTo,
  memberExpressionReferencingEnumMember,
} from './identifiers';
import { maybeTsAsExpression } from './tsAsExpression';
import { StringLiteralNode } from './types';
import { unionType } from './unionType';
import { wrapParserResult } from './wrapParserResult';

export const StringLiteral = unionType([
  wrapParserResult(memberExpressionReferencingEnumMember, (node) => {
    return {
      node: node.node as t.Node,
      value: node.value,
    };
  }),
  maybeTsAsExpression(
    maybeIdentifierTo(
      createParser({
        babelMatcher: t.isStringLiteral,
        parseNode: (node): StringLiteralNode => {
          return {
            value: node.value,
            node,
          };
        },
      }),
    ),
  ),
]);

export const NumericLiteral = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: t.isNumericLiteral,
      parseNode: (node) => {
        return {
          value: node.value,
          node,
        };
      },
    }),
  ),
);

export const BooleanLiteral = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: t.isBooleanLiteral,
      parseNode: (node) => {
        return {
          value: node.value,
          node,
        };
      },
    }),
  ),
);

export const AnyNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (node) => ({ node }),
});

export const Identifier = createParser({
  babelMatcher: t.isIdentifier,
  parseNode: (node) => ({ node }),
});

export const TemplateLiteral = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: t.isTemplateLiteral,
      parseNode: (node) => {
        let value = '';

        // TODO - this might lead to weird issues if there is actually more than a single quasi there
        node.quasis.forEach((quasi) => {
          value = `${value}${quasi.value.raw}`;
        });
        return {
          node,
          value,
        };
      },
    }),
  ),
);
