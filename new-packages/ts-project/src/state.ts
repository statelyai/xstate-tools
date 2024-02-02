import type {
  Expression,
  ObjectLiteralExpression,
  PropertyAssignment,
} from 'typescript';
import {
  ActionBlock,
  ActorBlock,
  Edge,
  EventTypeData,
  ExtractionContext,
  ExtractorMetaEntry,
  GuardBlock,
  Node,
  TreeNode,
} from './types';
import {
  everyDefined,
  findProperty,
  forEachStaticProperty,
  getJsonObject,
  getJsonValue,
  getPropertyKey,
  isUndefined,
  mapMaybeArrayElements,
  uniqueId,
  withAstPathSegment,
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
const createGuardBlock = ({
  sourceId,
  parentId,
}: {
  sourceId: string;
  parentId: string;
}): GuardBlock => {
  const blockId = uniqueId();
  return {
    blockType: 'guard',
    uniqueId: blockId,
    parentId,
    sourceId,
    properties: {
      type: sourceId,
      params: {},
    },
  };
};

function createEdge(
  ctx: ExtractionContext,
  {
    sourceId,
    eventTypeData,
    internal = true,
  }: {
    sourceId: string;
    eventTypeData: Edge['data']['eventTypeData'];
    internal?: boolean;
  },
): Edge {
  const edge: Edge = {
    type: 'edge',
    uniqueId: uniqueId(),
    source: sourceId,
    targets: [],
    data: {
      eventTypeData,
      actions: [],
      guard: undefined,
      description: undefined,
      metaEntries: [],
      internal,
    },
  };
  ctx.astPaths.edges[edge.uniqueId] = [...ctx.currentAstPath];
  return edge;
}

function isForbiddenTarget(
  ts: typeof import('typescript'),
  element: Expression,
): boolean {
  return (
    isUndefined(ts, element) ||
    // null isn't technically allowed by the XState's types but it behaves in the same way at runtime
    // and it's an easy thing to handle here
    element.kind === ts.SyntaxKind.NullKeyword
  );
}

function getObjectTransitionTargets(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  transition: ObjectLiteralExpression,
) {
  const targetProperty = findProperty(ctx, ts, transition, 'target');

  if (!targetProperty) {
    // TODO: if we failed to find this it doesn't exactly mean that it is a targetless transition
    // for the time being we assume that it is a targetless transition and return undefined as a valid value from here
    return;
  }

  if (isForbiddenTarget(ts, targetProperty.initializer)) {
    return;
  }

  // if we fail extracting the target here then we treat it as an error further down the road
  return mapMaybeArrayElements(
    ctx,
    ts,
    targetProperty.initializer,
    (expression) => {
      return ts.isStringLiteralLike(expression) ? expression.text : undefined;
    },
  );
}

function extractActionBlocks(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  expression: Expression,
  { parentId }: { parentId: string },
) {
  return mapMaybeArrayElements(
    ctx,
    ts,
    expression,
    (element): ActionBlock | undefined => {
      if (isUndefined(ts, element)) {
        return;
      }
      if (ts.isStringLiteralLike(element)) {
        return createActionBlock({
          sourceId: element.text,
          parentId,
        });
      }
      if (ts.isObjectLiteralExpression(element)) {
        const typeProperty = findProperty(ctx, ts, element, 'type');

        if (!typeProperty) {
          return;
        }

        if (ts.isStringLiteralLike(typeProperty.initializer)) {
          return createActionBlock({
            sourceId: typeProperty.initializer.text,
            parentId,
          });
        }
        ctx.errors.push({
          type: 'action_unhandled',
        });
        // fallthrough to creating inline action
      }

      return createActionBlock({
        sourceId: `inline:${uniqueId()}`,
        parentId,
      });
    },
  );
}

function registerGuardBlock(
  ctx: ExtractionContext,
  block: GuardBlock,
  edge: Edge,
) {
  edge.data.guard = block.uniqueId;
  ctx.digraph.blocks[block.uniqueId] = block;
  ctx.digraph.implementations.guards[block.sourceId] ??= {
    type: 'guard',
    id: block.sourceId,
    name: block.sourceId,
  };
}

function registerActionBlocks(
  ctx: ExtractionContext,
  blocks: ActionBlock[],
  parentContainer: string[],
) {
  for (const block of blocks) {
    parentContainer.push(block.uniqueId);
    ctx.digraph.blocks[block.uniqueId] = block;
    ctx.digraph.implementations.actions[block.sourceId] ??= {
      type: 'action',
      id: block.sourceId,
      name: block.sourceId,
    };
  }
}

/**
 * returns the auto-assigned internal value when no explicit configuration for this property is found
 */
function getImpliedInternalValue(
  ctx: ExtractionContext,
  targets: string[] | undefined,
) {
  if (ctx.xstateVersion !== '4') {
    return true;
  }
  return targets ? targets.some((t) => t.startsWith('.')) : true;
}

function extractEdgeGroup(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  transition: PropertyAssignment,
  {
    sourceId,
    eventTypeData,
  }: {
    sourceId: string;
    eventTypeData: EventTypeData;
  },
) {
  const mapped = mapMaybeArrayElements(
    ctx,
    ts,
    transition.initializer,
    (element): [Edge, string[] | undefined] | undefined => {
      if (isForbiddenTarget(ts, element)) {
        return [
          createEdge(ctx, {
            sourceId,
            eventTypeData,
          }),
          undefined,
        ];
      }
      if (ts.isStringLiteralLike(element)) {
        return [
          createEdge(ctx, {
            sourceId,
            eventTypeData,
            internal: getImpliedInternalValue(ctx, [element.text]),
          }),
          [element.text],
        ];
      }
      if (ts.isObjectLiteralExpression(element)) {
        const targets = getObjectTransitionTargets(ctx, ts, element);

        if (targets && !everyDefined(targets)) {
          ctx.errors.push({ type: 'transition_property_unhandled' });
          return;
        }

        const edge = createEdge(ctx, {
          sourceId,
          eventTypeData,
        });

        let seenGuardProp = false;
        let seenInternalProp = false;

        forEachStaticProperty(ctx, ts, element, (prop, key) => {
          switch (key) {
            case 'cond':
              if (seenGuardProp) {
                // `guard` was already seen
                ctx.errors.push({
                  type: 'property_mixed',
                });
                return;
              }
              if (findProperty(ctx, ts, element, 'guard')) {
                seenGuardProp = true;
                return;
              }
            // fallthrough
            case 'guard': {
              if (seenGuardProp) {
                ctx.errors.push({
                  type: 'property_mixed',
                });
              }
              seenGuardProp = true;

              if (ts.isStringLiteralLike(prop.initializer)) {
                const block = createGuardBlock({
                  sourceId: prop.initializer.text,
                  parentId: edge.uniqueId,
                });
                registerGuardBlock(ctx, block, edge);
                return;
              }
              if (ts.isObjectLiteralExpression(prop.initializer)) {
                const typeProperty = findProperty(
                  ctx,
                  ts,
                  prop.initializer,
                  'type',
                );

                if (
                  typeProperty &&
                  ts.isStringLiteralLike(typeProperty.initializer)
                ) {
                  const block = createGuardBlock({
                    sourceId: typeProperty.initializer.text,
                    parentId: edge.uniqueId,
                  });
                  registerGuardBlock(ctx, block, edge);
                  return;
                }

                ctx.errors.push({
                  type: 'transition_property_unhandled',
                });
                return;
              }
              const block = createGuardBlock({
                sourceId: `inline:${uniqueId()}`,
                parentId: edge.uniqueId,
              });
              registerGuardBlock(ctx, block, edge);
              return;
            }
            case 'actions': {
              const blocks = extractActionBlocks(ctx, ts, prop.initializer, {
                parentId: edge.uniqueId,
              });

              if (!everyDefined(blocks)) {
                ctx.errors.push({
                  type: 'transition_property_unhandled',
                });
                return;
              }

              registerActionBlocks(ctx, blocks, edge.data.actions);
              return;
            }
            case 'internal': {
              if (seenInternalProp) {
                // `reenter` was already seen
                ctx.errors.push({
                  type: 'property_mixed',
                });
                return;
              }
              seenInternalProp = true;

              if (findProperty(ctx, ts, element, 'reenter')) {
                return;
              }

              if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                edge.data.internal = true;
                return;
              }
              if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                edge.data.internal = false;
                return;
              }

              return;
            }
            case 'reenter':
              if (seenInternalProp) {
                ctx.errors.push({
                  type: 'property_mixed',
                });
              }
              seenInternalProp = true;

              if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
                edge.data.internal = false;
                return;
              }
              if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
                edge.data.internal = true;
                return;
              }

              return;
            case 'description': {
              edge.data.description = ts.isStringLiteralLike(prop.initializer)
                ? prop.initializer.text
                : undefined;
              return;
            }
            case 'meta': {
              extractMetaEntries(ctx, ts, prop, edge.data.metaEntries);
              return;
            }
          }
        });

        if (!seenInternalProp) {
          edge.data.internal = getImpliedInternalValue(ctx, targets);
        }

        return [edge, targets];
      }
    },
  );

  if (!everyDefined(mapped)) {
    ctx.errors.push({ type: 'transition_property_unhandled' });
    return;
  }

  for (const [edge, targets] of mapped) {
    ctx.digraph.edges[edge.uniqueId] = edge;
    if (targets) {
      ctx.originalTargets[edge.uniqueId] = targets;
    }
  }
}

function extractMetaEntries(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  prop: PropertyAssignment,
  metaEntries: ExtractorMetaEntry[],
) {
  if (isUndefined(ts, prop.initializer)) {
    return;
  }

  if (ts.isObjectLiteralExpression(prop.initializer)) {
    for (const meta of prop.initializer.properties) {
      if (ts.isPropertyAssignment(meta)) {
        const metaKey = getPropertyKey(ctx, ts, meta);
        if (metaKey) {
          metaEntries.push([metaKey, getJsonValue(ctx, ts, meta.initializer)]);
        }
      }
    }
    return;
  }

  ctx.errors.push({
    type: 'property_unhandled',
  });
}

export function extractState(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  state: Expression | undefined,
  { parentId, key }: { parentId: string | undefined; key: string },
): TreeNode | undefined {
  const node: Node = {
    type: 'node',
    uniqueId: uniqueId(),
    parentId,
    data: {
      key,
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

  const treeNode: TreeNode = {
    uniqueId: node.uniqueId,
    parentId,
    children: {},
  };

  ctx.treeNodes[node.uniqueId] = treeNode;

  ctx.astPaths.nodes[node.uniqueId] = [...ctx.currentAstPath];

  if (!state) {
    return treeNode;
  }

  if (!ts.isObjectLiteralExpression(state)) {
    ctx.errors.push({
      type: 'state_unhandled',
    });
    // TODO: rethink if the state should be returned here
    // this is a severe error that impacts a lot
    return treeNode;
  }

  forEachStaticProperty(ctx, ts, state, (prop, propKey) => {
    switch (propKey) {
      case 'id': {
        if (ts.isStringLiteralLike(prop.initializer)) {
          ctx.idMap[prop.initializer.text] = node.uniqueId;

          if (!node.parentId) {
            node.data.key = prop.initializer.text;
          }
          return;
        }
        return;
      }
      case 'context': {
        if (parentId !== undefined) {
          ctx.errors.push({
            type: 'state_property_invalid',
          });
          return;
        }
        if (ts.isObjectLiteralExpression(prop.initializer)) {
          const obj = getJsonObject(ctx, ts, prop.initializer);
          if (obj) {
            ctx.digraph.data.context = obj;
          }
          return;
        }
        if (
          ts.isFunctionExpression(prop.initializer) ||
          ts.isArrowFunction(prop.initializer)
        ) {
          ctx.digraph.data.context = `{{${prop.initializer.getText()}}}`;
          return;
        }

        ctx.errors.push({ type: 'state_property_unhandled' });
        return;
      }
      case 'always': {
        extractEdgeGroup(ctx, ts, prop, {
          sourceId: node.uniqueId,
          eventTypeData: { type: 'always' },
        });
        return;
      }
      case 'after': {
        if (!ts.isObjectLiteralExpression(prop.initializer)) {
          ctx.errors.push({ type: 'state_property_unhandled' });
          return;
        }

        forEachStaticProperty(ctx, ts, prop.initializer, (transition, key) => {
          extractEdgeGroup(ctx, ts, transition, {
            sourceId: node.uniqueId,
            eventTypeData: {
              type: 'after',
              delay: key,
            },
          });
        });
        return;
      }
      case 'on': {
        if (!ts.isObjectLiteralExpression(prop.initializer)) {
          ctx.errors.push({ type: 'state_property_unhandled' });
          return;
        }
        forEachStaticProperty(ctx, ts, prop.initializer, (prop, key) => {
          extractEdgeGroup(ctx, ts, prop, {
            sourceId: node.uniqueId,
            eventTypeData:
              key === '*'
                ? { type: 'wildcard' }
                : {
                    type: 'named',
                    eventType: key,
                  },
          });
        });
        return;
      }
      case 'onDone': {
        extractEdgeGroup(ctx, ts, prop, {
          sourceId: node.uniqueId,
          eventTypeData: { type: 'state.done' },
        });
        return;
      }
      case 'states':
        if (!ts.isObjectLiteralExpression(prop.initializer)) {
          ctx.errors.push({
            type: 'state_unhandled',
          });
          return;
        }
        for (let i = 0; i < prop.initializer.properties.length; i++) {
          const childState = prop.initializer.properties[i];
          if (ts.isPropertyAssignment(childState)) {
            const childKey = getPropertyKey(ctx, ts, childState);
            if (childKey) {
              const childTreeNode = withAstPathSegment(ctx, i, () =>
                extractState(ctx, ts, childState.initializer, {
                  parentId: node.uniqueId,
                  key: childKey,
                }),
              );
              if (!childTreeNode) {
                return;
              }
              treeNode.children[childKey] = childTreeNode;
            }
            continue;
          }
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          continue;
        }
        return;
      case 'initial': {
        if (ts.isStringLiteralLike(prop.initializer)) {
          node.data.initial = prop.initializer.text;
          return;
        }
        if (isUndefined(ts, prop.initializer)) {
          return;
        }
        ctx.errors.push({
          type: 'state_property_unhandled',
        });
        return;
      }
      case 'type': {
        if (ts.isStringLiteralLike(prop.initializer)) {
          const text = prop.initializer.text;
          if (text === 'history' || text === 'parallel' || text === 'final') {
            node.data.type = text;
            return;
          }
          if (text === 'atomic' || text === 'compound') {
            // type already starts as 'normal' so it doesn't have to be chamged here
            return;
          }
          ctx.errors.push({
            type: 'state_type_invalid',
          });
          return;
        }
        if (isUndefined(ts, prop.initializer)) {
          return;
        }
        ctx.errors.push({
          type: 'state_property_unhandled',
        });
        return;
      }
      // TODO: this property only has effect if type is set to history
      case 'history': {
        if (ts.isStringLiteralLike(prop.initializer)) {
          const text = prop.initializer.text;
          if (text === 'shallow' || text === 'deep') {
            node.data.history = text;
            return;
          }
          ctx.errors.push({
            type: 'state_history_invalid',
          });
        }
        if (prop.initializer.kind === ts.SyntaxKind.TrueKeyword) {
          node.data.history = 'deep';
          return;
        }
        if (prop.initializer.kind === ts.SyntaxKind.FalseKeyword) {
          node.data.history = 'shallow';
          return;
        }
        if (isUndefined(ts, prop.initializer)) {
          return;
        }
        ctx.errors.push({
          type: 'state_property_unhandled',
        });
        return;
      }
      case 'description': {
        if (ts.isStringLiteralLike(prop.initializer)) {
          node.data.description = prop.initializer.text;
          return;
        }
        if (isUndefined(ts, prop.initializer)) {
          return;
        }
        ctx.errors.push({
          type: 'state_property_unhandled',
        });
        return;
      }
      case 'meta': {
        extractMetaEntries(ctx, ts, prop, node.data.metaEntries);
        return;
      }
      case 'entry':
      case 'exit': {
        const blocks = extractActionBlocks(ctx, ts, prop.initializer, {
          parentId: node.uniqueId,
        });

        if (!everyDefined(blocks)) {
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          return;
        }

        registerActionBlocks(ctx, blocks, node.data[propKey]);
        return;
      }
      case 'invoke': {
        const blocks = mapMaybeArrayElements(
          ctx,
          ts,
          prop.initializer,
          (element, index): ActorBlock | undefined => {
            if (isUndefined(ts, element)) {
              return;
            }
            if (ts.isObjectLiteralExpression(element)) {
              const srcProperty = findProperty(ctx, ts, element, 'src');

              if (!srcProperty) {
                return;
              }

              let actorId: string | undefined;
              let onDone: PropertyAssignment | undefined;
              let onError: PropertyAssignment | undefined;

              forEachStaticProperty(ctx, ts, element, (prop, key) => {
                switch (key) {
                  case 'id': {
                    if (ts.isStringLiteralLike(prop.initializer)) {
                      actorId = prop.initializer.text;
                      return;
                    }
                    return;
                  }
                  case 'onDone': {
                    onDone = prop;
                    return;
                  }
                  case 'onError': {
                    onError = prop;
                    return;
                  }
                }
              });

              const block = createActorBlock({
                sourceId: ts.isStringLiteralLike(srcProperty.initializer)
                  ? srcProperty.initializer.text
                  : `inline:${uniqueId()}`,
                parentId: node.uniqueId,
                actorId: actorId ?? `inline:${uniqueId()}`,
              });

              if (onDone) {
                extractEdgeGroup(ctx, ts, onDone, {
                  sourceId: node.uniqueId,
                  eventTypeData: {
                    type: 'invocation.done',
                    invocationId: block.uniqueId,
                  },
                });
              }

              if (onError) {
                extractEdgeGroup(ctx, ts, onError, {
                  sourceId: node.uniqueId,
                  eventTypeData: {
                    type: 'invocation.error',
                    invocationId: block.uniqueId,
                  },
                });
              }

              return block;
            }

            return createActorBlock({
              sourceId: `inline:${uniqueId()}`,
              parentId: node.uniqueId,
              actorId: `inline:${uniqueId()}}`,
            });
          },
        );

        if (!everyDefined(blocks)) {
          ctx.errors.push({
            type: 'state_property_unhandled',
          });
          return;
        }

        for (const block of blocks) {
          node.data[propKey].push(block.uniqueId);
          ctx.digraph.blocks[block.uniqueId] = block;
          ctx.digraph.implementations.actors[block.sourceId] ??= {
            type: 'actor',
            id: block.sourceId,
            name: block.sourceId,
          };
        }
        return;
      }
    }
  });

  return treeNode;
}
