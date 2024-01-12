import type {
  Expression,
  NoSubstitutionTemplateLiteral,
  StringLiteral,
} from 'typescript';
import { ExtractionContext, ExtractorStateConfig } from './types';
import { getPropertyKey } from './utils';

const isUndefined = (ts: typeof import('typescript'), prop: Expression) =>
  ts.isIdentifier(prop) && ts.idText(prop) === 'undefined';
const isStringLiteral = (
  ts: typeof import('typescript'),
  prop: Expression,
): prop is StringLiteral | NoSubstitutionTemplateLiteral =>
  ts.isStringLiteral(prop) || ts.isNoSubstitutionTemplateLiteral(prop);

export function extractState(
  ctx: ExtractionContext,
  ts: typeof import('typescript'),
  state: Expression | undefined,
  path: string[],
): ExtractorStateConfig | undefined {
  const result = {
    states: [] as ExtractorStateConfig[],
    data: {} as Partial<ExtractorStateConfig['data']>,
  };

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
                const stateConfig = extractState(
                  ctx,
                  ts,
                  state.initializer,
                  path.concat(key),
                );
                if (stateConfig) {
                  result.states.push(stateConfig);
                }
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
          if (isStringLiteral(ts, prop.initializer)) {
            result.data[key] = prop.initializer.text;
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
          if (ts.isStringLiteral(prop.initializer)) {
            const text = prop.initializer.text;
            if (text === 'history' || text === 'parallel' || text === 'final') {
              result.data[key] = text;
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
          if (ts.isStringLiteral(prop.initializer)) {
            const text = prop.initializer.text;
            if (text === 'shallow' || text === 'deep') {
              result.data[key] = text;
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

  return {
    id: path.join('.'),
    data: {
      initial: result.data.initial ?? undefined,
      type: result.data.type ?? undefined,
      history: result.data.history ?? undefined,
      metaEntries: result.data.metaEntries ?? [],
      entry: result.data.entry ?? [],
      exit: result.data.exit ?? [],
      invoke: result.data.invoke ?? [],
      tags: result.data.tags ?? [],
      description: result.data.description ?? undefined,
    },
    states: result.states,
  };
}
