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

    // assign({})
    if (t.isObjectExpression(assigner)) {
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
              assignment[prop.key.name] = {
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
              assignment[prop.key.name] = {
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

      return assignment;
    }

    // assign(() => {})
    // assign(function() {})
    if (
      t.isArrowFunctionExpression(assigner) ||
      t.isFunctionExpression(assigner)
    ) {
      return {
        inlineImplementation: {
          type: 'expression',
          value: fileContent.slice(assigner.start!, assigner.end!),
        },
      };
    }
  }

  throw Error(`Unsupported assignment`);
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
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // raise({type: 'event', ...props})
    if (t.isObjectExpression(arg)) {
      return extractEventObject(arg, fileContent);
    }

    // raise('event')
    if (t.isStringLiteral(arg)) {
      return { type: { type: 'string', value: arg.value } };
    }
  }

  throw Error(`Unsupported raised event`);
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

export function extractStopProperties(
  actionNode: ActionNode,
  fileContent: string,
): { type: JsonEntryType; value: JsonValue } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    if (t.isStringLiteral(arg)) {
      return { type: 'string', value: arg.value };
    }

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
    | Record<
        string,
        {
          type: JsonEntryType;
          value: JsonValue;
        }
      >
    | { type: 'expression'; value: string };
  actorRef: {
    type: JsonEntryType;
    value: JsonValue;
  };
  options: {
    delay: { type: JsonEntryType; value: JsonValue } | undefined;
    id: { type: JsonEntryType; value: JsonValue } | undefined;
  };
} {
  const node = actionNode.node;
  let eventObject:
    | Record<
        string,
        {
          type: JsonEntryType;
          value: JsonValue;
        }
      >
    | { type: 'expression'; value: string } = {};
  let actorRef:
    | {
        type: JsonEntryType;
        value: JsonValue;
      }
    | undefined = undefined;
  let delay: { type: JsonEntryType; value: JsonValue } | undefined = undefined;
  let id: { type: JsonEntryType; value: JsonValue } | undefined = undefined;

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
      eventObject.type = {
        type: 'string',
        value: arg2.value,
      };
    }

    // sendTo({type: 'event', id: 1}),
    else if (t.isObjectExpression(arg2)) {
      eventObject = extractEventObject(arg2, fileContent);
    }

    // sendTo((ctx, e) => Record<string, any>)
    else if (
      t.isArrowFunctionExpression(arg2) ||
      t.isFunctionExpression(arg2)
    ) {
      eventObject = {
        type: 'expression',
        value: fileContent.slice(arg2.start!, arg2.end!),
      };
    }

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
        if (
          t.isArrowFunctionExpression(foundDelay.value) ||
          t.isFunctionExpression(foundDelay.value)
        ) {
          delay = {
            type: 'expression',
            value: fileContent.slice(foundDelay.start!, foundDelay.end!),
          };
        } else if (
          t.isStringLiteral(foundDelay.value) ||
          t.isNumericLiteral(foundDelay.value)
        ) {
          delay = {
            type: getLiteralType(foundDelay.value),
            value: foundDelay.value.value,
          };
        }
      }

      // id = string
      const foundId = arg3.properties.find(
        prop =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          prop.key.name === 'id',
      ) as t.ObjectProperty | undefined;
      if (
        foundId &&
        (t.isStringLiteral(foundId.value) || t.isNumericLiteral(foundId.value))
      ) {
        id = {
          type: getLiteralType(foundId.value),
          value: foundId.value.value,
        };
      }
    }

    return {
      event: eventObject,
      actorRef: actorRef!,
      options: {
        delay,
        id,
      },
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
