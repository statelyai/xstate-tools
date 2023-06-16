import * as t from '@babel/types';
import { ActionNode } from './actions';

// These types are copied over from studio blocks.
// array and object are extracted as expressions so Studio render them correctly when exporting
export type JsonEntry =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'bigint'; value: string }
  | { type: 'boolean'; value: boolean }
  | { type: 'null'; value: null }
  | { type: 'undefined'; value: undefined }
  | { type: 'expression'; value: string };
export type JsonValue = Pick<JsonEntry, 'value'>;
type JsonType = Pick<JsonEntry, 'type'>;

export function extractAssignAction(
  actionNode: ActionNode,
  fileContent: string,
):
  | {
      type: 'object';
      value: Record<string, JsonEntry>;
    }
  | { type: 'expression'; value: string } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const assigner = node.arguments[0];

    // assign({})
    if (
      t.isObjectExpression(assigner) &&
      assigner.properties.every(prop => t.isObjectProperty(prop))
    ) {
      const assignment: {
        type: 'object';
        value: Record<string, JsonEntry>;
      } = {
        type: 'object',
        value: {},
      };

      assigner.properties.forEach(prop => {
        // any regular object property and no spread elements or method or such
        if (t.isObjectProperty(prop)) {
          if (t.isIdentifier(prop.key)) {
            if (
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
                isTemplateLiteralWithExpressions(prop.value) ||
                t.isNullLiteral(prop.value)
              ) {
                assignment.value[prop.key.name] = {
                  type: 'expression',
                  value: fileContent.slice(prop.value.start!, prop.value.end!),
                };
              } else if (t.isTemplateLiteral(prop.value)) {
                assignment.value[prop.key.name] = {
                  type: 'string',
                  value:
                    prop.value.quasis[0].value.cooked ??
                    prop.value.quasis[0].value.raw,
                };
              } else {
                assignment.value[prop.key.name] = {
                  type: getLiteralType(prop.value),
                  value: prop.value.value,
                } as Extract<
                  JsonEntry,
                  { type: 'string' | 'number' | 'boolean' }
                >;
              }
            } else {
              /**
               * assign({prop: () => {}})
               * assign({prop: function() {}})
               * or anything else
               */
              assignment.value[prop.key.name] = {
                type: 'expression',
                value: fileContent.slice(prop.value.start!, prop.value.end!),
              };
            }
          }
        }
      });

      return assignment;
    }

    // assign(() => {})
    // assign(function() {})
    // assign({...someVar})
    // assign(someVar)
    // or anything else
    return {
      type: 'expression',
      value: fileContent.slice(assigner.start!, assigner.end!),
    };
  }

  throw Error(`Unsupported assign action`);
}

export function extractRaiseAction(
  actionNode: ActionNode,
  fileContent: string,
):
  | { type: 'expression'; value: string }
  | {
      type: 'object';
      value: Record<string, JsonEntry>;
    } {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // raise({type: 'event'}) object with plain object properties
    if (
      t.isObjectExpression(arg) &&
      arg.properties.every(prop => t.isObjectProperty(prop))
    ) {
      return extractEventObject(arg, fileContent);
    }

    // raise('event')
    if (t.isStringLiteral(arg)) {
      return {
        type: 'object',
        value: { type: { type: 'string', value: arg.value } },
      };
    }

    // raise(() => {}) or anything else
    return {
      type: 'expression',
      value: fileContent.slice(arg.start!, arg.end!),
    };
  }

  throw Error(`Unsupported raise action`);
}

export function extractLogAction(
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

    // log((ctx, evt) => {}) or anything else
    return {
      type: 'expression',
      value: fileContent.slice(node.start!, node.end!),
    };
  }

  throw Error(`Unsupported log action`);
}

export function extractStopAction(
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

    // stop(() => {}) or anything else
    return {
      type: 'expression',
      value: fileContent.slice(arg.start!, arg.end!),
    };
  }

  throw Error('Unsupported stop action');
}

type SendToEventArg =
  | { type: 'expression'; value: string }
  | {
      type: 'object';
      value: Record<string, JsonEntry>;
    }
  | undefined;
type SendToActorRefArg =
  | { type: 'string' | 'expression'; value: string }
  | undefined;
type SendToDelayArg =
  | { type: 'string' | 'expression'; value: string }
  | { type: 'number'; value: number }
  | undefined;
type SendToCancelationIdArg =
  | { type: 'string' | 'expression'; value: string }
  | { type: 'number'; value: number }
  | undefined;

export function extractSendToAction(
  actionNode: ActionNode,
  fileContent: string,
): {
  event: SendToEventArg;
  to: SendToActorRefArg;
  delay: SendToDelayArg;
  id: SendToCancelationIdArg;
} {
  const node = actionNode.node;
  let eventObject: SendToEventArg = undefined;
  let actorRef: SendToActorRefArg = undefined;
  let delay: SendToDelayArg = undefined;
  let id: SendToCancelationIdArg = undefined;
  if (t.isCallExpression(node)) {
    const arg1 = node.arguments[0];
    const arg2 = node.arguments[1];
    const arg3 = node.arguments[2];

    // Actor
    // sendTo('actorName')
    if (t.isStringLiteral(arg1)) {
      actorRef = { type: 'string', value: arg1.value };
    }
    // sendTo((ctx, e) => actorRef) or anything else
    else {
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
      eventObject = extractEventObject(arg2, fileContent);
    }

    // sendTo(, (ctx, e) => Record<string, any>) or anything else
    else {
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
        // delay: string
        if (
          t.isStringLiteral(foundDelay.value) ||
          t.isBigIntLiteral(foundDelay.value)
        ) {
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
        // delay: () => {} or anything else
        else {
          delay = {
            type: 'expression',
            value: fileContent.slice(
              foundDelay.value.start!,
              foundDelay.value.end!,
            ),
          };
        }
      }

      const foundId = arg3.properties.find(
        prop =>
          t.isObjectProperty(prop) &&
          t.isIdentifier(prop.key) &&
          prop.key.name === 'id',
      ) as t.ObjectProperty | undefined;
      if (foundId) {
        // id: string
        if (
          t.isStringLiteral(foundId.value) ||
          t.isBigIntLiteral(foundId.value)
        ) {
          id = {
            type: 'string',
            value: foundId.value.value,
          };
        }
        // id: number
        else if (t.isNumericLiteral(foundId.value)) {
          id = {
            type: 'number',
            value: foundId.value.value,
          };
        }
        // id: () => {} or anything else
        else {
          id = {
            type: 'expression',
            value: fileContent.slice(foundId.value.start!, foundId.value.end!),
          };
        }
      }
    }

    // Todo: what to do with invalid actions? like the one that misses the actor or event?
    return {
      event: eventObject,
      to: actorRef,
      delay: delay,
      id: id,
    };
  }

  throw Error(`Unsupported sendTo action`);
}

function getLiteralType(value: t.ObjectProperty['value']) {
  if (t.isNumericLiteral(value) || t.isBigIntLiteral(value)) {
    return 'number';
  }
  if (
    (t.isStringLiteral(value) || t.isBigIntLiteral(value)) &&
    !isTemplateLiteralWithExpressions(value)
  ) {
    return 'string';
  }
  if (t.isBooleanLiteral(value)) {
    return 'boolean';
  }
  throw Error('Unsupported literal property value');
}

// Todo: support namespace imports and aliased specifiers
// import * as actions from 'xstate'; actions.sendTo
// import {sendTo as x} from 'xstate'
export const isBuiltinActionWithName = (actionNode: ActionNode, name: string) =>
  t.isCallExpression(actionNode.node) &&
  t.isIdentifier(actionNode.node.callee) &&
  actionNode.node.callee.name === name;

function extractEventObject(
  eventObject: t.ObjectExpression,
  fileContent: string,
):
  | { type: 'expression'; value: string }
  | {
      type: 'object';
      value: Record<string, JsonEntry>;
    } {
  if (!eventObject.properties.every(prop => t.isObjectProperty(prop))) {
    return {
      type: 'expression',
      value: fileContent.slice(eventObject.start!, eventObject.end!),
    };
  }

  const extracted: Record<string, JsonEntry> = {};
  eventObject.properties.forEach(prop => {
    if (t.isObjectProperty(prop)) {
      if (t.isIdentifier(prop.key)) {
        if (t.isLiteral(prop.value)) {
          if (
            t.isRegExpLiteral(prop.value) ||
            isTemplateLiteralWithExpressions(prop.value) ||
            t.isNullLiteral(prop.value)
          ) {
            extracted[prop.key.name] = {
              type: 'expression',
              value: fileContent.slice(prop.value.start!, prop.value.end!),
            };
          } else if (t.isTemplateLiteral(prop.value)) {
            extracted[prop.key.name] = {
              type: 'string',
              value:
                prop.value.quasis[0].value.cooked ??
                prop.value.quasis[0].value.raw,
            };
          } else {
            extracted[prop.key.name] = {
              type: getLiteralType(prop.value),
              value: prop.value.value,
            } as Extract<JsonEntry, { type: 'string' | 'number' | 'boolean' }>;
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

  return { type: 'object', value: extracted };
}

function isTemplateLiteralWithExpressions(node: t.Literal): boolean {
  return t.isTemplateLiteral(node) && node.expressions.length > 0;
}
