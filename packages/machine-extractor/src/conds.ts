import { NodePath, types as t } from "@babel/core";
import { Condition } from "xstate";
import { DeclarationType } from ".";
import { createParser } from "./createParser";
import { unionType } from "./unionType";
import { isFunctionOrArrowFunctionExpression } from "./utils";

export interface CondNode {
  node: t.Node;
  path: NodePath<t.Node>;
  name: string;
  cond: Condition<any, any>;
  declarationType: DeclarationType;
  inlineDeclarationId: string;
}

const CondAsFunctionExpression = createParser({
  babelMatcher: isFunctionOrArrowFunctionExpression,
  parseNode: (path, context): CondNode => {
    return {
      path,
      node: path.node,
      name: "",
      cond: () => {
        return false;
      },
      declarationType: "inline",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  },
});

const CondAsStringLiteral = createParser({
  babelMatcher: t.isStringLiteral,
  parseNode: (path, context): CondNode => {
    return {
      path,
      node: path.node,
      name: path.node.value,
      cond: path.node.value,
      declarationType: "named",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  },
});

const CondAsNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (path, context): CondNode => {
    const id = context.getNodeHash(path.node);
    return {
      path,
      node: path.node,
      name: "",
      cond: id,
      declarationType: "unknown",
      inlineDeclarationId: id,
    };
  },
});

const CondAsIdentifier = createParser({
  babelMatcher: t.isIdentifier,
  parseNode: (path, context): CondNode => {
    const id = context.getNodeHash(path.node);
    return {
      path,
      node: path.node,
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
