import type { Expression } from 'typescript';
import { ExtractionContext, ExtractorNodeDef } from './types';
import { getPropertyKey, uniqueId } from './utils';

const isUndefined = (ts: typeof import('typescript'), prop: Expression) =>
  ts.isIdentifier(prop) && ts.idText(prop) === 'undefined';

const isTrue = (ts: typeof import('typescript'), prop: Expression) =>
  prop.kind === ts.SyntaxKind.TrueKeyword;
const isFalse = (ts: typeof import('typescript'), prop: Expression) =>
  prop.kind === ts.SyntaxKind.FalseKeyword;

export function extractState(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  state: Expression | undefined,
  parentId: string | undefined,
) {
  const node: ExtractorNodeDef = {
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
          if (isTrue(ts, prop.initializer)) {
            node.data.history = 'deep';
            continue;
          }
          if (isFalse(ts, prop.initializer)) {
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
