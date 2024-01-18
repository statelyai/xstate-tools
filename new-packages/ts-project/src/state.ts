import type { Expression, PropertyAssignment } from 'typescript';
import { ActionBlock, ActorBlock, ExtractionContext, Node } from './types';
import {
  everyDefined,
  getJsonObject,
  getJsonValue,
  getPropertyKey,
  isUndefined,
  mapMaybeArrayElements,
  uniqueId,
} from './utils';

const createActionBlock = ({
  sourceId,
  parentId,
}: {
  sourceId: string;
  parentId: string;
}): ActionBlock => {
  const blockId = uniqueId();
  return {
    blockType: 'action',
    uniqueId: blockId,
    parentId,
    sourceId,
    properties: {
      type: sourceId,
      params: {},
    },
  };
};
export function createActorBlock({
  sourceId,
  parentId,
  actorId,
}: {
  sourceId: string;
  parentId: string;
  actorId: string;
}): ActorBlock {
  const blockId = uniqueId();
  return {
    blockType: 'actor',
    uniqueId: blockId,
    parentId,
    sourceId,
    properties: {
      src: sourceId,
      id: actorId,
    },
  };
}

function getActorId(
  ts: typeof import('typescript'),
  parentId: string,
  index: number,
  idProperty: PropertyAssignment | undefined,
) {
  if (idProperty && ts.isStringLiteralLike(idProperty.initializer)) {
    return idProperty.initializer.text;
  }
  // TODO: replace this with `:serializableId:invocation[:index]`
  return `${parentId}:invocation[${index}]`;
}

export function extractState(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  state: Expression | undefined,
  parentId: string | undefined,
) {
  const node: Node = {
    type: 'node',
    uniqueId: uniqueId(),
    parentId,
    data: {
      initial: undefined,
      type: 'normal',
      history: undefined,
      metaEntries: [],
      entry: [],
      exit: [],
      invoke: [],
      tags: [],
      description: undefined,
    },
  };
  ctx.digraph.nodes[node.uniqueId] = node;

  if (!state) {
    return node;
  }

  if (!ts.isObjectLiteralExpression(state)) {
    ctx.errors.push({
      type: 'state_unhandled',
    });
    // TODO: rethink if the state should be returned here
    // this is a severe error that impacts a lot
    return node;
  }

  for (const prop of state.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = getPropertyKey(ctx, ts, prop);

      switch (key) {
        case 'context': {
          if (parentId !== undefined) {
            ctx.errors.push({
              type: 'state_property_invalid',
            });
            continue;
          }
          if (ts.isObjectLiteralExpression(prop.initializer)) {
            ctx.digraph.data.context = getJsonObject(
              ctx,
              ts,
              prop.initializer,
            )!;
            continue;
          }
          if (
            ts.isFunctionExpression(prop.initializer) ||
            ts.isArrowFunction(prop.initializer)
          ) {
            ctx.digraph.data.context = `{{${prop.initializer.getText(
              ctx.sourceFile,
            )}}}`;
            continue;
          }

          ctx.errors.push({ type: 'state_property_unhandled' });
          break;
        }
        case 'states':
          if (!ts.isObjectLiteralExpression(prop.initializer)) {
            ctx.errors.push({
              type: 'state_unhandled',
            });
            break;
          }
          for (const state of prop.initializer.properties) {
            if (ts.isPropertyAssignment(state)) {
              const childKey = getPropertyKey(ctx, ts, state);
              if (childKey) {
                extractState(ctx, ts, state.initializer, node.uniqueId);
              }
              continue;
            }
            if (ts.isShorthandPropertyAssignment(state)) {
              ctx.errors.push({
                type: 'state_property_unhandled',
              });
              continue;
            }
            if (ts.isSpreadAssignment(state)) {
              ctx.errors.push({
                type: 'state_property_unhandled',
              });
              continue;
            }
            if (
              ts.isMethodDeclaration(state) ||
              ts.isGetAccessorDeclaration(state) ||
              ts.isSetAccessorDeclaration(state)
            ) {
              ctx.errors.push({
                type: 'state_property_unhandled',
              });
              continue;
            }

            state satisfies never;
          }
          break;
        case 'initial': {
          if (ts.isStringLiteralLike(prop.initializer)) {
            node.data.initial = prop.initializer.text;
            continue;
          }
          if (isUndefined(ts, prop.initializer)) {
            continue;
          }
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          break;
        }
        case 'type': {
          if (ts.isStringLiteralLike(prop.initializer)) {
            const text = prop.initializer.text;
            if (text === 'history' || text === 'parallel' || text === 'final') {
              node.data.type = text;
              continue;
            }
            if (text === 'atomic' || text === 'compound') {
              continue;
            }
            ctx.errors.push({
              type: 'state_type_invalid',
            });
            continue;
          }
          if (isUndefined(ts, prop.initializer)) {
            continue;
          }
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          break;
        }
        // TODO: this property only has effect if type is set to history
        case 'history': {
          if (ts.isStringLiteralLike(prop.initializer)) {
            const text = prop.initializer.text;
            if (text === 'shallow' || text === 'deep') {
              node.data.history = text;
              continue;
            }
            ctx.errors.push({
              type: 'state_history_invalid',
            });
          }
          if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
            node.data.history = 'deep';
            continue;
          }
          if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
            node.data.history = 'shallow';
            continue;
          }
          if (isUndefined(ts, prop.initializer)) {
            continue;
          }
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          break;
        }
        case 'description': {
          if (ts.isStringLiteralLike(prop.initializer)) {
            node.data.description = prop.initializer.text;
            continue;
          }
          if (isUndefined(ts, prop.initializer)) {
            continue;
          }
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          break;
        }
        case 'meta': {
          if (ts.isObjectLiteralExpression(prop.initializer)) {
            for (const meta of prop.initializer.properties) {
              if (ts.isPropertyAssignment(meta)) {
                const metaKey = getPropertyKey(ctx, ts, meta);
                if (metaKey) {
                  node.data.metaEntries.push([
                    metaKey,
                    getJsonValue(ctx, ts, meta.initializer),
                  ]);
                }
                continue;
              }
            }
            continue;
          }
          if (isUndefined(ts, prop.initializer)) {
            continue;
          }

          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          break;
        }
        case 'entry':
        case 'exit': {
          const blocks = mapMaybeArrayElements(
            ts,
            prop.initializer,
            (element): ActionBlock | undefined => {
              if (isUndefined(ts, element)) {
                return;
              }
              if (ts.isStringLiteralLike(element)) {
                return createActionBlock({
                  sourceId: element.text,
                  parentId: node.uniqueId,
                });
              }
              if (ts.isObjectLiteralExpression(element)) {
                const typeProperty = element.properties.find(
                  (prop): prop is PropertyAssignment =>
                    ts.isPropertyAssignment(prop) &&
                    getPropertyKey(ctx, ts, prop) === 'type',
                );

                if (!typeProperty) {
                  return;
                }

                if (ts.isStringLiteralLike(typeProperty.initializer)) {
                  return createActionBlock({
                    sourceId: typeProperty.initializer.text,
                    parentId: node.uniqueId,
                  });
                }
              }

              return createActionBlock({
                sourceId: `inline:${uniqueId()}`,
                parentId: node.uniqueId,
              });
            },
          );

          if (!everyDefined(blocks)) {
            ctx.errors.push({
              type: 'state_property_unhandled',
            });
            continue;
          }

          for (const block of blocks) {
            node.data[key].push(block.uniqueId);
            ctx.digraph.blocks[block.uniqueId] = block;
            ctx.digraph.implementations.actions[block.sourceId] ??= {
              type: 'action',
              id: block.sourceId,
              name: block.sourceId,
            };
          }
          break;
        }
        case 'invoke': {
          const blocks = mapMaybeArrayElements(
            ts,
            prop.initializer,
            (element, index): ActorBlock | undefined => {
              if (isUndefined(ts, element)) {
                return;
              }
              if (ts.isObjectLiteralExpression(element)) {
                const srcProperty = element.properties.find(
                  (prop): prop is PropertyAssignment =>
                    ts.isPropertyAssignment(prop) &&
                    getPropertyKey(ctx, ts, prop) === 'src',
                );

                if (!srcProperty) {
                  return;
                }

                const idProperty = element.properties.find(
                  (prop): prop is PropertyAssignment =>
                    ts.isPropertyAssignment(prop) &&
                    getPropertyKey(ctx, ts, prop) === 'id',
                );

                return createActorBlock({
                  sourceId: ts.isStringLiteralLike(srcProperty.initializer)
                    ? srcProperty.initializer.text
                    : `inline:${uniqueId()}`,
                  parentId: node.uniqueId,
                  actorId: getActorId(ts, node.uniqueId, index, idProperty),
                });
              }

              return createActorBlock({
                sourceId: `inline:${uniqueId()}`,
                parentId: node.uniqueId,
                actorId: getActorId(ts, node.uniqueId, index, undefined),
              });
            },
          );

          if (!everyDefined(blocks)) {
            ctx.errors.push({
              type: 'state_property_unhandled',
            });
            continue;
          }

          for (const block of blocks) {
            node.data[key].push(block.uniqueId);
            ctx.digraph.blocks[block.uniqueId] = block;
            ctx.digraph.implementations.actors[block.sourceId] ??= {
              type: 'actor',
              id: block.sourceId,
              name: block.sourceId,
            };
          }
          break;
        }
      }
      continue;
    }

    if (ts.isShorthandPropertyAssignment(prop)) {
      ctx.errors.push({
        type: 'state_property_unhandled',
      });
      continue;
    }
    if (ts.isSpreadAssignment(prop)) {
      ctx.errors.push({
        type: 'state_property_unhandled',
      });
      continue;
    }
    if (
      ts.isMethodDeclaration(prop) ||
      ts.isGetAccessorDeclaration(prop) ||
      ts.isSetAccessorDeclaration(prop)
    ) {
      ctx.errors.push({
        type: 'state_property_unhandled',
      });
      continue;
    }

    prop satisfies never;
  }

  return node;
}
