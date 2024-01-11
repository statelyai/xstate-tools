import type { Expression } from 'typescript';
import { ExtractionContext, ExtractorStateConfig } from './types';
import { getPropertyKey } from './utils';

const hasUnefinedValue = (ts: typeof import('typescript'), prop: Expression) =>
  ts.isIdentifier(prop) && ts.idText(prop) === 'undefined';

const StateConfigDataWhitelistedProperties = new Set([
  'key',
  'type',
  'history',
  'metaEntries',
  'entry',
  'exit',
  'invoke',
  'initial',
  'tags',
  'description',
]);

const isStateNodeConfigProperty = (
  key: string,
): key is keyof ExtractorStateConfig['data'] =>
  StateConfigDataWhitelistedProperties.has(key);

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
      node: state,
    });
    return;
  }

  for (const prop of state.properties) {
    if (ts.isPropertyAssignment(prop)) {
      const key = getPropertyKey(ctx, ts, prop);

      /* state.states */
      if (key === 'states' && ts.isObjectLiteralExpression(prop.initializer)) {
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
              node: state,
            });
            continue;
          }
          if (ts.isSpreadAssignment(state)) {
            ctx.errors.push({
              type: 'state_property_unhandled',
              node: state,
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
              node: state,
            });
            continue;
          }

          state satisfies never;
        }
      } else if (key && isStateNodeConfigProperty(key)) {
        switch (key) {
          case 'initial': {
            if (ts.isStringLiteral(prop.initializer)) {
              result.data[key] = prop.initializer.text;
            } else if (hasUnefinedValue(ts, prop.initializer)) {
              result.data[key] = undefined;
            } else {
              ctx.errors.push({
                type: 'state_property_unhandled',
                node: prop,
              });
            }
            break;
          }
          case 'type': {
            const isStringWithValidValue =
              ts.isStringLiteral(prop.initializer) &&
              ['history', 'atomic', 'compound', 'parallel', 'final'].includes(
                prop.initializer.text,
              );

            if (isStringWithValidValue) {
              result.data[key] = prop.initializer
                .text as ExtractorStateConfig['data']['type'];
            } else if (hasUnefinedValue(ts, prop.initializer)) {
              result.data[key] = undefined;
            } else {
              ctx.errors.push({
                type: 'state_property_unhandled',
                node: prop,
              });
            }
            break;
          }
          // TODO: this property only has effect if type is set to history
          case 'history': {
            const isStringWithValidValue =
              ts.isStringLiteral(prop.initializer) &&
              ['shallow', 'deep'].includes(prop.initializer.text);

            if (isStringWithValidValue) {
              result.data[key] = prop.initializer
                .text as ExtractorStateConfig['data']['history'];
            } else if (hasUnefinedValue(ts, prop.initializer)) {
              result.data[key] = undefined;
            } else {
              ctx.errors.push({
                type: 'state_property_unhandled',
                node: prop,
              });
            }
            break;
          }
          default:
        }
      }
      continue;
    }

    if (ts.isShorthandPropertyAssignment(prop)) {
      ctx.errors.push({
        type: 'state_property_unhandled',
        node: prop,
      });
      continue;
    }
    if (ts.isSpreadAssignment(prop)) {
      ctx.errors.push({
        type: 'state_property_unhandled',
        node: prop,
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
        node: prop,
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
