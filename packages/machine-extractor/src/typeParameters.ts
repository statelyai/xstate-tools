import { types as t } from "@babel/core";
import { AnyParser } from ".";
import { createParser } from "./createParser";

export const TSTypeParameterInstantiation = <Result>(
  parser: AnyParser<Result>
) =>
  createParser({
    babelMatcher: t.isTSTypeParameterInstantiation,
    extract: (path, context) => {
      return {
        path,
        node: path.node,
        params: path.get("params").map((param) => parser.parse(param, context)),
      };
    },
  });

export const TSType = createParser({
  babelMatcher: t.isTSType,
  extract: (node) => {
    return {
      node,
    };
  },
});

export const AnyTypeParameterList = TSTypeParameterInstantiation(TSType);
