import { NodePath, types as t } from "@babel/core";
import { Parser, ParserContext } from "./types";

export interface CreateParserParams<T extends t.Node, Result> {
  /**
   * Matcher function used to determine if the current AST `Node` passed to a
   * parser should be handled by that parser.
   */
  babelMatcher: (node: any) => node is T;
  /**
   * A function which extracts metadata about the current AST `Node` to be used
   * later for parsing machines.
   */
  extract: (path: NodePath<T>, context: ParserContext) => Result;
}

/**
 * Creates a parser, which can be run later on AST nodes
 * to work out if they match
 */
export const createParser = <T extends t.Node, Result>(
  params: CreateParserParams<T, Result>
): Parser<T, Result> => {
  const matches = (node: t.Node) => {
    return params.babelMatcher(node);
  };
  const parse = (path: any, context: ParserContext): Result | undefined => {
    if (!matches(path?.node)) return undefined;
    return params.extract(path, context);
  };
  return {
    parse,
    matches,
  };
};
