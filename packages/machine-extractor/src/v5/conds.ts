import * as t from '@babel/types';
import { GuardObject } from 'xstate5';
import { DeclarationType } from '.';
import { createParser } from './createParser';
import { unionType } from './unionType';
import { isFunctionOrArrowFunctionExpression } from './utils';

export interface GuardNode {
  node: t.Node;
  name: string;
  guard: GuardObject<any, any> | (() => boolean) | string;
  declarationType: DeclarationType;
  inlineDeclarationId: string;
}

const CondAsFunctionExpression = createParser({
  babelMatcher: isFunctionOrArrowFunctionExpression,
  parseNode: (node, context): GuardNode => {
    return {
      node,
      name: '',
      guard: () => {
        return false;
      },
      declarationType: 'inline',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
});

const CondAsStringLiteral = createParser({
  babelMatcher: t.isStringLiteral,
  parseNode: (node, context): GuardNode => {
    return {
      node,
      name: node.value,
      guard: node.value,
      declarationType: 'named',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
});

const CondAsParametrizedGuard = createParser({
  babelMatcher: t.isObjectExpression,
  parseNode: (node, context): GuardNode | null => {
    let propValue: t.Node | null = null;

    for (const prop of node.properties) {
      if (!t.isObjectProperty(prop) || prop.computed) {
        continue;
      }
      if (
        (t.isStringLiteral(prop.key) && prop.key.value === 'type') ||
        (t.isIdentifier(prop.key) && prop.key.name === 'type')
      ) {
        propValue = prop.value;
        break;
      }
    }

    if (!propValue || !t.isStringLiteral(propValue)) {
      return null;
    }

    const id = context.getNodeHash(node);
    return {
      node,
      name: propValue.value,
      guard: propValue.value,
      declarationType: 'named',
      inlineDeclarationId: id,
    };
  },
});

const CondAsNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (node, context): GuardNode => {
    const id = context.getNodeHash(node);
    return {
      node,
      name: '',
      guard: id,
      declarationType: 'unknown',
      inlineDeclarationId: id,
    };
  },
});

export const Guard = unionType([
  CondAsFunctionExpression,
  CondAsStringLiteral,
  CondAsParametrizedGuard,
  CondAsNode,
]);
