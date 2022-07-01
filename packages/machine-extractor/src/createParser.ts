import { NodePath, types as t } from "@babel/core";
import { Parser, ParserContext } from "./types";

/**
 * Creates a parser, which can be run later on AST nodes
 * to work out if they match
 */
export const createParser = <T extends t.Node, Result>(params: {
  babelMatcher: (node: any) => node is T;
  parsePath: (path: NodePath<T>, context: ParserContext) => Result;
}): Parser<T, Result> => {
  const matches = (node: t.Node) => {
    return params.babelMatcher(node);
  };
  const parse = (path: any, context: ParserContext): Result | undefined => {
    if (!matches(path?.node)) return undefined;
    return params.parsePath(path, context);
  };
  return {
    parse,
    matches,
  };
};
