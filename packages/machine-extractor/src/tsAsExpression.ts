import * as t from '@babel/types';
import { AnyParser } from '.';
import { createParser } from './createParser';
import { unionType } from './unionType';

export const tsAsExpression = <Result>(parser: AnyParser<Result>) => {
  return createParser({
    babelMatcher: t.isTSAsExpression,
    parseNode: (node, context) => {
      if (parser.matches(node.expression)) {
        return parser.parse(node.expression, context);
      }
    },
  });
};

export const maybeTsAsExpression = <Result>(parser: AnyParser<Result>) => {
  return unionType([parser, tsAsExpression(parser)]);
};
