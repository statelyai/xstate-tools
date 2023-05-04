import * as t from '@babel/types';
import { ActionNode } from './actions';

export function extractAssignment(actionNode: ActionNode, fileContent: string) {
  const node = actionNode.node;
  const assignment: Record<
    string,
    {
      type: 'expression' | 'string' | 'number' | 'boolean' | 'array' | 'object';
      value: string | number | boolean | Array<any> | object | null;
    }
  > = {};
  if (t.isCallExpression(node)) {
    const assigner = node.arguments[0];

    if (t.isObjectExpression(assigner)) {
      assigner.properties.forEach((prop) => {
        if (t.isObjectProperty(prop)) {
          if (t.isIdentifier(prop.key)) {
            if (t.isArrowFunctionExpression(prop.value)) {
              assignment[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            } else if (t.isLiteral(prop.value)) {
              if (t.isNullLiteral(prop.value)) {
                assignment[prop.key.name] = {
                  type: 'expression',
                  value: null,
                };
              } else if (
                t.isRegExpLiteral(prop.value) ||
                t.isTemplateLiteral(prop.value)
              ) {
                assignment[prop.key.name] = {
                  type: 'expression',
                  value: fileContent.slice(prop.value.start!, prop.value.end!),
                };
              } else {
                assignment[prop.key.name] = {
                  type: getLiteralType(prop.value),
                  value: prop.value.value,
                };
              }
            }
          }
        }
      });
    } else if (t.isArrowFunctionExpression(assigner)) {
      assignment.inlineAssigner = {
        type: 'expression',
        value: fileContent.slice(assigner.start!, assigner.end!),
      };
    }
  }

  return assignment;
}

function getLiteralType(value: t.ObjectProperty['value']) {
  if (
    t.isNullLiteral(value) ||
    t.isRegExpLiteral(value) ||
    t.isTemplateLiteral(value)
  ) {
    throw Error('null,regexp or template literans can not have literal type');
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  if (t.isNumericLiteral(value)) {
    return 'number';
  }
  if (t.isStringLiteral(value)) {
    return 'string';
  }
  if (t.isBooleanLiteral(value)) {
    return 'boolean';
  }
  throw Error('Unsupported property value');
}

export const isAssignAction = (actionNode: ActionNode) => {
  return (
    t.isCallExpression(actionNode.node) &&
    t.isIdentifier(actionNode.node.callee) &&
    actionNode.node.callee.name === 'assign'
  );
};
