import * as t from '@babel/types';
import { DeclarationType } from '.';
import { createParser } from './createParser';
import { maybeIdentifierTo } from './identifiers';
import { BooleanLiteral, StringLiteral } from './scalars';
import { MaybeTransitionArray } from './transitions';
import { maybeTsAsExpression } from './tsAsExpression';
import { unionType } from './unionType';
import {
  isFunctionOrArrowFunctionExpression,
  maybeArrayOf,
  objectTypeWithKnownKeys,
} from './utils';

interface InvokeNode {
  node: t.Node;
  value: string;
  declarationType: DeclarationType;
  inlineDeclarationId: string;
}

const InvokeSrcFunctionExpression = maybeTsAsExpression(
  maybeIdentifierTo(
    createParser({
      babelMatcher: isFunctionOrArrowFunctionExpression,
      parseNode: (node, context): InvokeNode => {
        const id = context.getNodeHash(node);

        return {
          value: id,
          node,
          declarationType: 'inline',
          inlineDeclarationId: id,
        };
      },
    }),
  ),
);

const InvokeSrcNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (node, context): InvokeNode => {
    const id = context.getNodeHash(node);
    return {
      value: id,
      node,
      declarationType: 'unknown',
      inlineDeclarationId: id,
    };
  },
});

const InvokeSrcStringLiteral = createParser({
  babelMatcher: t.isStringLiteral,
  parseNode: (node, context): InvokeNode => ({
    value: node.value,
    node,
    declarationType: 'named',
    inlineDeclarationId: context.getNodeHash(node),
  }),
});

const InvokeSrcIdentifier = createParser({
  babelMatcher: t.isIdentifier,
  parseNode: (node, context): InvokeNode => {
    const id = context.getNodeHash(node);
    return {
      value: id,
      node,
      declarationType: 'identifier',
      inlineDeclarationId: context.getNodeHash(node),
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
