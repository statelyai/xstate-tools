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
):
  | {
      type: 'object';
      value: Record<string, { type: JsonEntryType; value: JsonValue }>;
    }
  | { type: 'expression'; value: string } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const assigner = node.arguments[0];

    // assign({})
    if (t.isObjectExpression(assigner)) {
      const assignment: {
        type: 'object';
        value: Record<string, { type: JsonEntryType; value: JsonValue }>;
      } = {
        type: 'object',
        value: {},
      };
      assigner.properties.forEach(prop => {
        if (t.isObjectProperty(prop)) {
          if (t.isIdentifier(prop.key)) {
            /**
             * assign({prop: () => {}})
             * assign({prop: function() {}})
             */
            if (
              t.isArrowFunctionExpression(prop.value) ||
              t.isFunctionExpression(prop.value)
            ) {
              assignment.value[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            } else if (
              /**
               * assign({prop: []})
               * assign({prop: {}})
               */
              t.isArrayExpression(prop.value) ||
              t.isObjectExpression(prop.value)
            ) {
              assignment.value[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            } else if (t.isLiteral(prop.value)) {
              /**
               * assign({prop: literal value})
               */
              if (
                t.isRegExpLiteral(prop.value) ||
                t.isTemplateLiteral(prop.value) ||
                t.isNullLiteral(prop.value)
              ) {
                assignment.value[prop.key.name] = {
                  type: 'expression',
                  value: fileContent.slice(prop.value.start!, prop.value.end!),
                };
              } else {
                assignment.value[prop.key.name] = {
                  type: getLiteralType(prop.value),
                  value: prop.value.value,
                };
              }
            }
          }
        }
      });

      return assignment;
    }

    // assign(() => {})
    // assign(function() {})
    if (
      t.isArrowFunctionExpression(assigner) ||
      t.isFunctionExpression(assigner)
    ) {
      return {
        type: 'expression',
        value: fileContent.slice(assigner.start!, assigner.end!),
      };
    }
  }

  throw Error(`Unsupported assignment`);
}

export function extractRaisedEvent(
  actionNode: ActionNode,
  fileContent: string,
):
  | { type: 'expression'; value: string }
  | {
      type: 'object';
      value: Record<
        string,
        {
          type: JsonEntryType;
          value: JsonValue;
        }
      >;
    } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // raise({type: 'event', ...props})
    if (t.isObjectExpression(arg)) {
      return { type: 'object', value: extractEventObject(arg, fileContent) };
    }

    // raise('event')
    if (t.isStringLiteral(arg)) {
      return {
        type: 'object',
        value: { type: { type: 'string', value: arg.value } },
      };
    }

    // raise(() => {})
    if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
      return {
        type: 'expression',
        value: fileContent.slice(arg.start!, arg.end!),
      };
    }
  }

  throw Error(`Unsupported raised event`);
}

export function extractLogExpression(
  actionNode: ActionNode,
  fileContent: string,
): { type: 'string' | 'expression'; value: string } {
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

export function extractStopProperties(
  actionNode: ActionNode,
  fileContent: string,
): { type: 'string' | 'expression'; value: string } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // stop('id')
    if (t.isStringLiteral(arg)) {
      return { type: 'string', value: arg.value };
    }

    // stop(() => {})
    if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
      return {
        type: 'expression',
        value: fileContent.slice(arg.start!, arg.end!),
      };
    }
  }

  throw Error('Unsupported stop expression');
}

export function extractSendToProperties(
  actionNode: ActionNode,
  fileContent: string,
): {
  event:
    | { type: 'expression'; value: string }
    | {
        type: 'object';
        value: Record<
          string,
          {
            type: JsonEntryType;
            value: JsonValue;
          }
        >;
      };
  to: { type: 'string' | 'expression'; value: string };
  delay:
    | { type: 'string' | 'expression'; value: string }
    | { type: 'number'; value: number };
  id: string | number;
} {
  const node = actionNode.node;
  let eventObject:
    | { type: 'expression'; value: string }
    | {
        type: 'object';
        value: Record<
          string,
          {
            type: JsonEntryType;
            value: JsonValue;
          }
        >;
      }
    | undefined = undefined;
  let actorRef:
    | { type: 'string' | 'expression'; value: string }
    | undefined = undefined;
  let delay:
    | { type: 'string' | 'expression'; value: string }
    | { type: 'number'; value: number }
    | undefined = undefined;
  let id: string | number | undefined = undefined;

  if (t.isCallExpression(node)) {
    const arg1 = node.arguments[0];
    const arg2 = node.arguments[1];
    const arg3 = node.arguments[2];

    // Actor
    // sendTo('actorName')
    if (t.isStringLiteral(arg1)) {
      actorRef = { type: 'string', value: arg1.value };
    }
    // sendTo((ctx, e) => actorRef)
    else if (
      t.isArrowFunctionExpression(arg1) ||
      t.isFunctionExpression(arg1)
    ) {
      actorRef = {
        type: 'expression',
        value: fileContent.slice(arg1.start!, arg1.end!),
      };
    }

    // Event
    // sendTo(, 'eventType')
    if (t.isStringLiteral(arg2)) {
      eventObject = {
        type: 'object',
        value: {
          type: {
            type: 'string',
            value: arg2.value,
          },
        },
      };
    }

    // sendTo(, {type: 'event', id: 1}),
    else if (t.isObjectExpression(arg2)) {
      eventObject = {
        type: 'object',
        value: extractEventObject(arg2, fileContent),
      };
    }

    // sendTo(, (ctx, e) => Record<string, any>)
    else if (
      t.isArrowFunctionExpression(arg2) ||
      t.isFunctionExpression(arg2)
    ) {
      eventObject = {
        type: 'expression',
        value: fileContent.slice(arg2.start!, arg2.end!),
      };
    }

    // delay

    // Options
    if (t.isObjectExpression(arg3)) {
      // delay = string | number | (ctx, e) => string | number
      const foundDelay = arg3.properties.find(
        prop =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          prop.key.name === 'delay',
      ) as t.ObjectProperty | undefined;
      if (foundDelay) {
        // delay: () => {}
        if (
          t.isArrowFunctionExpression(foundDelay.value) ||
          t.isFunctionExpression(foundDelay.value)
        ) {
          delay = {
            type: 'expression',
            value: fileContent.slice(foundDelay.start!, foundDelay.end!),
          };
        }
        // delay: string
        else if (t.isStringLiteral(foundDelay.value)) {
          delay = {
            type: 'string',
            value: foundDelay.value.value,
          };
        }
        // delay: number
        else if (t.isNumericLiteral(foundDelay.value)) {
          delay = {
            type: 'number',
            value: foundDelay.value.value,
          };
        }
      }

      const foundId = arg3.properties.find(
        prop =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          prop.key.name === 'id',
      ) as t.ObjectProperty | undefined;
      // id: string | number
      if (
        foundId &&
        (t.isStringLiteral(foundId.value) || t.isNumericLiteral(foundId.value))
      ) {
        id = foundId.value.value;
      }
    }

    // Todo: what to do with invalid actions? like the one that misses the actor or event?
    return {
      event: eventObject!,
      to: actorRef!,
      delay: delay!,
      id: id!,
    };
  }

  throw Error(`Unsupported sendTo expression`);
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

export const isBuiltinActionWithName = (actionNode: ActionNode, name: string) =>
  t.isCallExpression(actionNode.node) &&
  t.isIdentifier(actionNode.node.callee) &&
  actionNode.node.callee.name === name;

function extractEventObject(
  eventObject: t.ObjectExpression,
  fileContent: string,
): Record<string, { type: JsonEntryType; value: JsonValue }> {
  const extracted: Record<
    string,
    { type: JsonEntryType; value: JsonValue }
  > = {};
  eventObject.properties.forEach(prop => {
    if (t.isObjectProperty(prop)) {
      if (t.isIdentifier(prop.key)) {
        if (t.isLiteral(prop.value)) {
          if (
            t.isRegExpLiteral(prop.value) ||
            t.isTemplateLiteral(prop.value) ||
            t.isNullLiteral(prop.value)
          ) {
            extracted[prop.key.name] = {
              type: 'expression',
              value: fileContent.slice(prop.value.start!, prop.value.end!),
            };
          } else {
            extracted[prop.key.name] = {
              type: getLiteralType(prop.value),
              value: prop.value.value,
            };
          }
        } else if (
          t.isArrayExpression(prop.value) ||
          t.isObjectExpression(prop.value)
        ) {
          extracted[prop.key.name] = {
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

  return extracted;
}
