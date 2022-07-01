import { NodePath, types as t } from "@babel/core";
import { ParserContext } from ".";
import { AnyParser } from "./types";

/**
 * Allows you to wrap a parser and reformulate
 * the result at the end of it
 */
export const wrapParserResult = <T extends t.Node, Result, NewResult>(
  parser: AnyParser<Result>,
  changeResult: (
    result: Result,
    path: NodePath<T>,
    context: ParserContext
  ) => NewResult | undefined
): AnyParser<NewResult> => {
  return {
    matches: parser.matches,
    parse: (path: NodePath<any> | null | undefined, context) => {
      const result = parser.parse(path, context);
      if (!result) return undefined;
      return changeResult(result, path!, context);
    },
  };
};
