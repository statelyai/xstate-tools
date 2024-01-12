import type { Expression } from 'typescript';
import {
  ExtractionContext,
  ExtractorDigraphDef,
  ExtractorNodeDef,
} from './types';
import { getPropertyKey } from './utils';

const isUndefined = (ts: typeof import('typescript'), prop: Expression) =>
  ts.isIdentifier(prop) && ts.idText(prop) === 'undefined';

export function extractState(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  state: Expression | undefined,
  nodes: ExtractorDigraphDef['nodes'],
  path: string[] = [''], // todo handle set key or id on root state
) {
  const result: Partial<ExtractorNodeDef['data']> = {};

  if (!state) {
    return;
  }

  if (!ts.isObjectLiteralExpression(state)) {
    ctx.errors.push({
      type: 'state_unhandled',
    });
    return;
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
              const key = getPropertyKey(ctx, ts, state);
              if (key) {
                extractState(
                  ctx,
                  ts,
                  state.initializer,
                  nodes,
                  path.concat(key),
                );
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
            result[key] = prop.initializer.text;
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
              result[key] = text;
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
              result[key] = text;
              continue;
            }
            ctx.errors.push({
              type: 'state_history_invalid',
            });
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

  // TODO: this needs to be a sophiticated id
  const uniqueId = path.join('.');

  nodes[uniqueId] = {
    type: 'node',
    uniqueId,
    parentId: path.length > 1 ? path.slice(0, -1).join('.') : undefined,
    data: {
      initial: result.initial ?? undefined,
      type: result.type ?? undefined,
      history: result.history ?? undefined,
      metaEntries: result.metaEntries ?? [],
      entry: result.entry ?? [],
      exit: result.exit ?? [],
      invoke: result.invoke ?? [],
      tags: result.tags ?? [],
      description: result.description ?? undefined,
    },
  };
}
