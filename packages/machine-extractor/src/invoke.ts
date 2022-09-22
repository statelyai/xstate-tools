import { NodePath, types as t } from "@babel/core";
import { DeclarationType } from ".";
import { createParser } from "./createParser";
import { maybeIdentifierTo } from "./identifiers";
import { BooleanLiteral, StringLiteral } from "./scalars";
import { MaybeTransitionArray } from "./transitions";
import { maybeTsAsExpression } from "./tsAsExpression";
import { unionType } from "./unionType";
import {
  isFunctionOrArrowFunctionExpression,
  maybeArrayOf,
  objectTypeWithKnownKeys,
} from "./utils";

interface InvokeNode {
  path: NodePath<t.Node>;
  node: t.Node;
  value: string;
  declarationType: DeclarationType;
  inlineDeclarationId: string;
}

const InvokeSrcFunctionExpression = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: isFunctionOrArrowFunctionExpression,
      extract: (path, context): InvokeNode => {
        const id = context.getNodeHash(path.node);

        return {
          value: id,
          path,
          node: path.node,
          declarationType: "inline",
          inlineDeclarationId: id,
        };
      },
    })
  )
);

const InvokeSrcNode = createParser({
  babelMatcher: t.isNode,
  extract: (path, context): InvokeNode => {
    const id = context.getNodeHash(path.node);
    return {
      value: id,
      path,
      node: path.node,
      declarationType: "unknown",
      inlineDeclarationId: id,
    };
  },
});

const InvokeSrcStringLiteral = createParser({
  babelMatcher: t.isStringLiteral,
  extract: (path, context): InvokeNode => ({
    value: path.node.value,
    path,
    node: path.node,
    declarationType: "named",
    inlineDeclarationId: context.getNodeHash(path.node),
  }),
});

const InvokeSrcIdentifier = createParser({
  babelMatcher: t.isIdentifier,
  extract: (path, context): InvokeNode => {
    const id = context.getNodeHash(path.node);
    return {
      value: id,
      path,
      node: path.node,
      declarationType: "identifier",
      inlineDeclarationId: context.getNodeHash(path.node),
    };
  },
});

const InvokeSrc = unionType([
  InvokeSrcStringLiteral,
  InvokeSrcFunctionExpression,
  InvokeSrcIdentifier,
  InvokeSrcNode,
]);

const InvokeConfigObject = objectTypeWithKnownKeys({
  id: StringLiteral,
  src: InvokeSrc,
  onDone: MaybeTransitionArray,
  onError: MaybeTransitionArray,
  autoForward: BooleanLiteral,
  forward: BooleanLiteral,
});

export const Invoke = maybeArrayOf(InvokeConfigObject);
