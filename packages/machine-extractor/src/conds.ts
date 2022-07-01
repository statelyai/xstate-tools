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

const CondAsParametrizedGuard = createParser({
  babelMatcher: t.isObjectExpression,
  parseNode: (path, context): CondNode | null => {
    let propValue: t.Node | null = null;

    for (const prop of path.node.properties) {
      if (!t.isObjectProperty(prop) || prop.computed) {
        continue;
      }
      if (
        (t.isStringLiteral(prop.key) && prop.key.value === "type") ||
        (t.isIdentifier(prop.key) && prop.key.name === "type")
      ) {
        propValue = prop.value;
        break;
      }
    }

    if (!propValue || !t.isStringLiteral(propValue)) {
      return null;
    }

    const id = context.getNodeHash(path.node);
    return {
      path,
      node: path.node,
      name: propValue.value,
      cond: propValue.value,
      declarationType: "named",
      inlineDeclarationId: id,
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

export const Cond = unionType([
  CondAsFunctionExpression,
  CondAsStringLiteral,
  CondAsParametrizedGuard,
  CondAsNode,
]);
