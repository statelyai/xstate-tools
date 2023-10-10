import * as t from '@babel/types';
import { createParser } from '../createParser';
import { GetParserResult } from '../utils';
import { LiveNode } from './skyConfigNode';
import { ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES } from './skyConfigUtils';

export type TMachineCallExpression = GetParserResult<
  typeof SkyConfigCallExpression
>;

export const SkyConfigCallExpression = createParser({
  babelMatcher: t.isCallExpression,
  parseNode: (node, context) => {
    if (
      t.isMemberExpression(node.callee) &&
      t.isIdentifier(node.callee.property) &&
      ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES.includes(
        node.callee.property.name,
      )
    ) {
      return {
        callee: node.callee,
        calleeName: node.callee.property.name,
        definition: LiveNode.parse(node.arguments[0], context),
        isMemberExpression: true,
        node,
      };
    }

    if (
      t.isIdentifier(node.callee) &&
      ALLOWED_SKY_CONFIG_CALL_EXPRESSION_NAMES.includes(node.callee.name)
    ) {
      return {
        callee: node.callee,
        calleeName: node.callee.name,
        definition: LiveNode.parse(node.arguments[0], context),
        isMemberExpression: false,
        node,
      };
    }
  },
});
