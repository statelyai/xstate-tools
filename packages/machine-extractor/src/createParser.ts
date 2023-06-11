import * as t from '@babel/types';
import { Parser, ParserContext } from './types';

/**
 * Creates a parser, which can be run later on AST nodes
 * to work out if they match
 */
export const createParser = <T extends t.Node, Result>(params: {
  babelMatcher: (node: any) => node is T;
  parseNode: (node: T, context: ParserContext) => Result;
}): Parser<T, Result> => {
  const matches = (node: T) => {
    return params.babelMatcher(node);
  };
  const parse = (node: any, context: ParserContext): Result | undefined => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!matches(node)) return undefined;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return params.parseNode(node, context);
  };
  return {
    parse,
    matches,
  };
};
