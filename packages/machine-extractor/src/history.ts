import { NodePath, types as t } from "@babel/core";
import { createParser } from "./createParser";
import { unionType } from "./unionType";

interface HistoryNode {
  node: t.Node;
  path: NodePath<t.Node>;
  value: "shallow" | "deep" | boolean;
}

const HistoryAsString = createParser({
  babelMatcher: t.isStringLiteral,
  parsePath: (path): HistoryNode => {
    return {
      node: path.node,
      path,
      value: path.node.value as HistoryNode["value"],
    };
  },
});

const HistoryAsBoolean = createParser({
  babelMatcher: t.isBooleanLiteral,
  parsePath: (path): HistoryNode => {
    return {
      node: path.node,
      path,
      value: path.node.value,
    };
  },
});

export const History = unionType([HistoryAsString, HistoryAsBoolean]);
