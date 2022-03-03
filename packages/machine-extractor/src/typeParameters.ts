import { createParser } from "./createParser";
import { types as t } from "@babel/core";
import { AnyParser } from ".";
import { arrayOf } from "./utils";

export const TSTypeParameterInstantiation = <Result>(
  parser: AnyParser<Result>,
) =>
  createParser({
    babelMatcher: t.isTSTypeParameterInstantiation,
    parseNode: (node, context) => {
      return {
        node,
        params: node.params.map((param) => parser.parse(param, context)),
      };
    },
  });

export const TSType = createParser({
  babelMatcher: t.isTSType,
  parseNode: (node) => {
    return {
      node,
    };
  },
});

export const AnyTypeParameterList = TSTypeParameterInstantiation(TSType);
