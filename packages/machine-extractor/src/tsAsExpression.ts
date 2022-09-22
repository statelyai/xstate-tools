import { types as t } from "@babel/core";
import { AnyParser } from ".";
import { createParser } from "./createParser";
import { unionType } from "./unionType";

export const tsAsExpression = <Result>(parser: AnyParser<Result>) => {
  return createParser({
    babelMatcher: t.isTSAsExpression,
    extract: (path, context) => {
      if (parser.matches(path.get("expression")?.node)) {
        return parser.parse(path.get("expression"), context);
      }
    },
  });
};

export const maybeTsAsExpression = <Result>(parser: AnyParser<Result>) => {
  return unionType([parser, tsAsExpression(parser)]);
};
