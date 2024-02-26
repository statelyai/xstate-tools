import * as t from '@babel/types';
import { Condition } from 'xstate';
import { DeclarationType } from '.';
import { createParser } from './createParser';
import { unionType } from './unionType';
import { isFunctionOrArrowFunctionExpression } from './utils';

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
    let funcName = '';
    if (t.isFunctionExpression(node)) {
      funcName = node.id?.name ?? '';
    }
    return {
      node,
      name: funcName,
      cond: () => {
        return false;
      },
      declarationType: funcName ? 'named' : 'inline',
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
      declarationType: 'named',
      inlineDeclarationId: context.getNodeHash(node),
    };
  },
});

const CondAsParametrizedGuard = createParser({
  babelMatcher: t.isObjectExpression,
  parseNode: (node, context): CondNode | null => {
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
      cond: propValue.value,
      declarationType: 'named',
      inlineDeclarationId: id,
    };
  },
});

const CondAsNode = createParser({
  babelMatcher: t.isNode,
  parseNode: (node, context): CondNode => {
    const id = context.getNodeHash(node);
    let varName = '';
    if (t.isIdentifier(node)) {
      varName = node.name;
    }
    return {
      node,
      name: varName,
      cond: id,
      declarationType: varName ? 'named' : 'unknown',
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
