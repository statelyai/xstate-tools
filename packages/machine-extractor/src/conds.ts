import { types as t } from "@babel/core";
import { Condition } from "xstate";
import { DeclarationType } from ".";
import { createParser } from "./createParser";
import { unionType } from "./unionType";
import { isFunctionOrArrowFunctionExpression } from "./utils";

export interface CondNode {
  node: t.Node;
  name: string;
  cond: Condition<any, any>;
  declarationType: DeclarationType;
  inlineDeclarationId: string;
}

const CondAsFunctionExpression = createParser({
  babelMatcher: isFunctionOrArrowFunctionExpression,
  parseNode: (node, context): CondNode => {
    return {
      node,
      name: "",
      cond: () => {
        return false;
      },
      declarationType: "inline",
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
});

const CondAsStringLiteral = createParser({
  babelMatcher: t.isStringLiteral,
  parseNode: (node, context): CondNode => {
    return {
      node,
      name: node.value,
      cond: node.value,
      declarationType: "named",
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
});

const CondAsNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (node, context): CondNode => {
    const id = context.getNodeHash(node);
    return {
      node,
      name: "",
      cond: id,
      declarationType: "unknown",
      inlineDeclarationId: id,
    };
  },
});

const CondAsIdentifier = createParser({
  babelMatcher: t.isIdentifier,
  parseNode: (node, context): CondNode => {
    const id = context.getNodeHash(node);
    return {
      node,
      name: "",
      cond: id,
      declarationType: "identifier",
      inlineDeclarationId: id,
    };
  },
});

export const Cond = unionType([
  CondAsFunctionExpression,
  CondAsStringLiteral,
  CondAsIdentifier,
  CondAsNode,
]);
