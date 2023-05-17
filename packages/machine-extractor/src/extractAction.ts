import * as t from '@babel/types';
import { ActionNode } from './actions';

// These types are copied over from studio blocks.
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonEntry = [string, { value: JsonValue; type: JsonEntryType }];
// Using this type to avoid merging 'expression' and string for JsonEntry.type
type JsonExpression = 'expression' & { __tag: 'JsonExpression' };
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonArray
  | JsonObject;
type JsonEntryType = JsonValue | JsonExpression;

export function extractAssignment(
  actionNode: ActionNode,
  fileContent: string,
): Record<
  string,
  {
    type: JsonEntryType;
    value: JsonValue;
  }
> {
  const node = actionNode.node;
  const assignment: Record<
    string,
    {
      type: JsonEntryType;
      value: JsonValue;
    }
  > = {};
  if (t.isCallExpression(node)) {
    const assigner = node.arguments[0];

    if (t.isObjectExpression(assigner)) {
      assigner.properties.forEach(prop => {
        if (t.isObjectProperty(prop)) {
          if (t.isIdentifier(prop.key)) {
            if (
              t.isArrowFunctionExpression(prop.value) ||
              t.isFunctionExpression(prop.value)
            ) {
              assignment[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            } else if (
              t.isArrayExpression(prop.value) ||
              t.isObjectExpression(prop.value)
            ) {
              assignment[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            } else if (t.isLiteral(prop.value)) {
              if (
                t.isRegExpLiteral(prop.value) ||
                t.isTemplateLiteral(prop.value) ||
                t.isNullLiteral(prop.value)
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
    } else if (
      t.isArrowFunctionExpression(assigner) ||
      t.isFunctionExpression(assigner)
    ) {
      assignment.inlineImplementation = {
        type: 'expression',
        value: fileContent.slice(assigner.start!, assigner.end!),
      };
    }
  }

  return assignment;
}

export function extractRaisedEvent(
  actionNode: ActionNode,
  fileContent: string,
): Record<
  string,
  {
    type: JsonEntryType;
    value: JsonValue;
  }
> {
  const node = actionNode.node;
  const event: Record<string, { type: JsonEntryType; value: JsonValue }> = {};
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // raise({type: 'event', ...props})
    if (t.isObjectExpression(arg)) {
      arg.properties.forEach(prop => {
        if (t.isObjectProperty(prop)) {
          if (t.isIdentifier(prop.key)) {
            if (t.isLiteral(prop.value)) {
              if (
                t.isRegExpLiteral(prop.value) ||
                t.isTemplateLiteral(prop.value) ||
                t.isNullLiteral(prop.value)
              ) {
                event[prop.key.name] = {
                  type: 'expression',
                  value: fileContent.slice(prop.value.start!, prop.value.end!),
                };
              } else {
                event[prop.key.name] = {
                  type: getLiteralType(prop.value),
                  value: prop.value.value,
                };
              }
            } else if (
              t.isArrayExpression(prop.value) ||
              t.isObjectExpression(prop.value)
            ) {
              event[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            } else {
              console.warn(
                `Unsupported property value of type ${prop.value.type} in assignment`,
                { key: prop.key.name, value: prop.value },
              );
            }
          }
        }
      });
    }

    // raise('event')
    else if (t.isStringLiteral(arg)) {
      event.type = { type: 'string', value: arg.value };
    }
  }

  return event;
}

export function extractLogExpression(
  actionNode: ActionNode,
  fileContent: string,
): { type: JsonEntryType; value: JsonValue } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // log('string')
    if (t.isStringLiteral(arg)) {
      return {
        type: 'string',
        value: arg.value,
      };
    }

    // log((ctx, evt) => {})
    if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
      return {
        type: 'expression',
        value: fileContent.slice(node.start!, node.end!),
      };
    }
  }

  throw Error(`Unsupported log expression`);
}

function getLiteralType(value: t.ObjectProperty['value']) {
  if (
    t.isNullLiteral(value) ||
    t.isRegExpLiteral(value) ||
    t.isTemplateLiteral(value)
  ) {
    throw Error('null,regexp or template literals can not have literal type');
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
  throw Error('Unsupported literal property value');
}

export const isAssignAction = (actionNode: ActionNode) => {
  return (
    t.isCallExpression(actionNode.node) &&
    t.isIdentifier(actionNode.node.callee) &&
    actionNode.node.callee.name === 'assign'
  );
};

export const isRaiseAction = (actionNode: ActionNode) => {
  return (
    t.isCallExpression(actionNode.node) &&
    t.isIdentifier(actionNode.node.callee) &&
    actionNode.node.callee.name === 'raise'
  );
};

export const isLogAction = (actionNode: ActionNode) => {
  return (
    t.isCallExpression(actionNode.node) &&
    t.isIdentifier(actionNode.node.callee) &&
    actionNode.node.callee.name === 'log'
  );
};
