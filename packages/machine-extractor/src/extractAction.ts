import traverse from '@babel/traverse';
import * as t from '@babel/types';
import { ActionNode } from './actions';
import {
  ExtractedLogAction,
  ExtractorAssignAction,
  ExtractorRaiseAction,
  ExtractorSendToAction,
  ExtractorStopAction,
  JsonExpressionString,
  JsonItem,
} from './types';
import { toJsonExpressionString } from './utils';

interface SendToOptionObjectPropertyKey extends t.Identifier {
  name: 'id' | 'delay';
}
interface SendToOptionObjectProperty extends t.ObjectProperty {
  key: SendToOptionObjectPropertyKey;
}

export function extractAssignAction(
  actionNode: ActionNode,
  fileContent: string,
): ExtractorAssignAction['action']['assignment'] {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const assigner = node.arguments[0];

    // assign({})
    if (
      t.isObjectExpression(assigner) &&
      assigner.properties.every((prop) => t.isObjectProperty(prop))
    ) {
      const assignment: Record<string, JsonItem> = {};

      assigner.properties.forEach((prop) => {
        // any regular object property and no spread elements or method or such
        if (t.isObjectProperty(prop)) {
          if (
            /**
             * assign({prop: []})
             */
            t.isArrayExpression(prop.value)
          ) {
            assignment[getObjectPropertyKey(prop)] = extractArrayRecursively(
              prop.value,
              fileContent,
            );
          } else if (
            /**
             * assign({prop: {}})
             */
            t.isObjectExpression(prop.value)
          ) {
            assignment[getObjectPropertyKey(prop)] = extractObjectRecursively(
              prop.value,
              fileContent,
            );
          } else if (t.isLiteral(prop.value)) {
            /**
             * assign({prop: literal value})
             */
            if (
              t.isRegExpLiteral(prop.value) ||
              isTemplateLiteralWithExpressions(prop.value) ||
              t.isNullLiteral(prop.value)
            ) {
              assignment[getObjectPropertyKey(prop)] = toJsonExpressionString(
                fileContent.slice(prop.value.start!, prop.value.end!),
              );
            } else if (t.isTemplateLiteral(prop.value)) {
              assignment[getObjectPropertyKey(prop)] =
                prop.value.quasis[0].value.cooked ??
                prop.value.quasis[0].value.raw;
            } else {
              assignment[getObjectPropertyKey(prop)] = prop.value.value;
            }
          } else {
            /**
             * assign({prop: () => {}})
             * assign({prop: function() {}})
             * or anything else
             */
            assignment[getObjectPropertyKey(prop)] = toJsonExpressionString(
              fileContent.slice(prop.value.start!, prop.value.end!),
            );
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
    return toJsonExpressionString(
      fileContent.slice(assigner.start!, assigner.end!),
    );
  }

  throw Error(`Unsupported assign action`);
}

export function extractRaiseAction(
  actionNode: ActionNode,
  fileContent: string,
): ExtractorRaiseAction['action']['event'] {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // raise({type: 'event'}) object with plain object properties
    if (
      t.isObjectExpression(arg) &&
      arg.properties.every((prop) => t.isObjectProperty(prop))
    ) {
      return extractEventObject(arg, fileContent);
    }

    // raise('event')
    if (t.isStringLiteral(arg)) {
      return {
        type: arg.value,
      };
    }

    // raise(() => {}) or anything else
    return toJsonExpressionString(fileContent.slice(arg.start!, arg.end!));
  }

  throw Error(`Unsupported raise action`);
}

export function extractLogAction(
  actionNode: ActionNode,
  fileContent: string,
): ExtractedLogAction['action']['expr'] {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // log('string')
    if (t.isStringLiteral(arg)) {
      return arg.value;
    }

    // log((ctx, evt) => {}) or anything else
    return toJsonExpressionString(fileContent.slice(arg.start!, arg.end!));
  }

  throw Error(`Unsupported log action`);
}

export function extractStopAction(
  actionNode: ActionNode,
  fileContent: string,
): ExtractorStopAction['action']['id'] {
  const node = actionNode.node;
  if (t.isCallExpression(node)) {
    const arg = node.arguments[0];

    // stop('id')
    if (t.isStringLiteral(arg)) {
      return arg.value;
    }

    // stop(() => {}) or anything else
    return toJsonExpressionString(fileContent.slice(arg.start!, arg.end!));
  }

  throw Error('Unsupported stop action');
}

type SendToEventArg = JsonExpressionString | Record<string, JsonItem>;
type SendToActorRefArg = string | JsonExpressionString;
type SendToIdArg = string | JsonExpressionString;
type SendToDelayArg = string | number | JsonExpressionString;

export function extractSendToAction(
  actionNode: ActionNode,
  fileContent: string,
): Omit<ExtractorSendToAction['action'], 'type'> {
  const node = actionNode.node;
  let eventObject: SendToEventArg = {};
  let actorRef: SendToActorRefArg = '';
  const options: { id?: SendToIdArg; delay?: SendToDelayArg } = {};
  if (t.isCallExpression(node)) {
    const arg1 = node.arguments[0];
    const arg2 = node.arguments[1];
    const arg3 = node.arguments[2];

    // Actor
    // sendTo('actorName')
    if (t.isStringLiteral(arg1)) {
      actorRef = arg1.value;
    }
    // sendTo((ctx, e) => actorRef) or anything else
    else {
      actorRef = toJsonExpressionString(
        fileContent.slice(arg1.start!, arg1.end!),
      );
    }

    // Event
    // sendTo(, 'eventType')
    if (t.isStringLiteral(arg2)) {
      eventObject = {
        type: arg2.value,
      };
    }

    // sendTo(, {type: 'event', id: 1}),
    else if (t.isObjectExpression(arg2)) {
      eventObject = extractEventObject(arg2, fileContent);
    }

    // sendTo(, (ctx, e) => Record<string, any>) or anything else
    else {
      eventObject = toJsonExpressionString(
        fileContent.slice(arg2.start!, arg2.end!),
      );
    }

    // Options
    if (t.isObjectExpression(arg3)) {
      arg3.properties
        .filter(
          (prop): prop is SendToOptionObjectProperty =>
            t.isObjectProperty(prop) &&
            ['id', 'delay'].includes(getObjectPropertyKey(prop)),
        )
        .forEach((prop) => {
          const name = getObjectPropertyKey(prop) as 'id' | 'delay';
          if (t.isStringLiteral(prop.value) || t.isBigIntLiteral(prop.value)) {
            options[name] = prop.value.value;
          } else if (t.isNumericLiteral(prop.value)) {
            // TODO: We need a unified way of handling invalid inputs. For now, let's just handle convert number ID to stringified number
            if (name === 'id') {
              options[name] = prop.value.value.toString();
            } else {
              options[name] = prop.value.value;
            }
          }
          // () => {} or anything else
          else {
            options[name] = toJsonExpressionString(
              fileContent.slice(prop.value.start!, prop.value.end!),
            );
          }
        });
    }

    // Todo: what to do with invalid actions? like the one that misses the actor or event?
    // @ts-ignore
    // Todo: Help me type this so options includes delay and id but could also include anything else
    return {
      event: eventObject,
      to: actorRef,
      ...options,
    };
  }

  throw Error(`Unsupported sendTo action`);
}

// Todo: support namespace imports and aliased specifiers
// import * as actions from 'xstate'; actions.sendTo
// import {sendTo as x} from 'xstate'
export const getActionCreatorName = (actionNode: ActionNode) =>
  t.isCallExpression(actionNode.node) && t.isIdentifier(actionNode.node.callee)
    ? actionNode.node.callee.name
    : undefined;

export const getObjectPropertyKey = (
  prop: t.ObjectProperty | t.ObjectMethod,
): string => {
  if (t.isIdentifier(prop.key)) {
    return prop.key.name;
  }
  if (t.isStringLiteral(prop.key) || t.isNumericLiteral(prop.key)) {
    return prop.key.value.toString();
  }
  throw Error(`Can not access prop.key for property ${JSON.stringify(prop)}`);
};

const isNull = (node: t.Node | null): node is null => t.isNullLiteral(node);

export function extractArrayRecursively(
  array: t.ArrayExpression,
  fileContent: string,
): JsonItem[] {
  const extracted: JsonItem[] = [];
  array.elements.forEach((elem) => {
    if (isNull(elem)) {
      extracted.push(null);
    } else if (t.isArrayExpression(elem)) {
      extracted.push(extractArrayRecursively(elem, fileContent));
    } else if (t.isObjectExpression(elem)) {
      extracted.push(extractObjectRecursively(elem, fileContent));
    } else {
      if (t.isLiteral(elem)) {
        if (
          t.isRegExpLiteral(elem) ||
          isTemplateLiteralWithExpressions(elem) ||
          t.isNullLiteral(elem)
        ) {
          extracted.push(fileContent.slice(elem.start!, elem.end!));
        } else if (t.isTemplateLiteral(elem)) {
          extracted.push(
            elem.quasis[0].value.cooked ?? elem.quasis[0].value.raw,
          );
        } else {
          extracted.push(elem.value);
        }
      }
    }
  });
  return extracted;
}

export function extractObjectRecursively(
  object: t.ObjectExpression,
  fileContent: string,
) {
  const extracted: Record<string, JsonItem> = {};

  object.properties.forEach((prop) => {
    if (t.isObjectProperty(prop)) {
      if (t.isLiteral(prop.value)) {
        if (
          t.isRegExpLiteral(prop.value) ||
          isTemplateLiteralWithExpressions(prop.value) ||
          t.isNullLiteral(prop.value)
        ) {
          extracted[getObjectPropertyKey(prop)] = fileContent.slice(
            prop.value.start!,
            prop.value.end!,
          );
        } else if (t.isTemplateLiteral(prop.value)) {
          extracted[getObjectPropertyKey(prop)] =
            prop.value.quasis[0].value.cooked ?? prop.value.quasis[0].value.raw;
        } else {
          extracted[getObjectPropertyKey(prop)] = prop.value.value;
        }
      } else if (t.isArrayExpression(prop.value)) {
        extracted[getObjectPropertyKey(prop)] = extractArrayRecursively(
          prop.value,
          fileContent,
        );
      } else if (t.isObjectExpression(prop.value)) {
        extracted[getObjectPropertyKey(prop)] = extractObjectRecursively(
          prop.value,
          fileContent,
        );
      } else {
        console.warn(
          `Unsupported property value of type ${prop.value.type} in assignment`,
          { key: getObjectPropertyKey(prop), value: prop.value },
        );
      }
    }
  });
  return extracted;
}

// TODO: enforce return type to ActionEvent so `type` property is required
export function extractEventObject(
  eventObject: t.ObjectExpression,
  fileContent: string,
): JsonExpressionString | Record<string, JsonItem> {
  if (!eventObject.properties.every((prop) => t.isObjectProperty(prop))) {
    return toJsonExpressionString(
      fileContent.slice(eventObject.start!, eventObject.end!),
    );
  }

  return extractObjectRecursively(eventObject, fileContent);
}

function isTemplateLiteralWithExpressions(node: t.Node): boolean {
  return t.isTemplateLiteral(node) && node.expressions.length > 0;
}
