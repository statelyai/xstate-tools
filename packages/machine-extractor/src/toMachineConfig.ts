import * as t from '@babel/types';
import { MaybeArrayOfActions } from './actions';
import { CondNode } from './conds';
import {
  extractAssignAction,
  extractLogAction,
  extractObjectRecursively,
  extractRaiseAction,
  extractSendToAction,
  extractStopAction,
  getObjectPropertyKey,
} from './extractAction';
import { TMachineCallExpression } from './machineCallExpression';
import { StateNodeReturn } from './stateNode';
import { MaybeTransitionArray } from './transitions';
import {
  ExtractorInvokeNodeConfig,
  ExtractorMachineAction,
  ExtractorMachineConfig,
  ExtractorMachineGuard,
  ExtractorNamedGuard,
  ExtractorStateNodeConfig,
  ExtractrorTransitionNodeConfig,
  JsonItem,
  JsonObject,
  MaybeArray,
} from './types';
import { GetParserResult, toJsonExpressionString } from './utils';

export interface ToMachineConfigOptions {
  /**
   * Original source code text
   */
  fileContent: string;
}

const parseStateNode = (
  astResult: StateNodeReturn,
  opts: ToMachineConfigOptions | undefined,
): ExtractorStateNodeConfig => {
  const config: ExtractorMachineConfig = {};

  if (astResult?.id) {
    config.id = astResult.id.value;
  }

  if (astResult?.initial) {
    config.initial = astResult.initial.value;
  }

  if (astResult?.type) {
    config.type = astResult.type.value as any;
  }

  if (astResult.entry) {
    config.entry = getActionConfig(astResult.entry, opts);
  }
  if (astResult.onEntry) {
    config.onEntry = getActionConfig(astResult.onEntry, opts);
  }
  if (astResult.exit) {
    config.exit = getActionConfig(astResult.exit, opts);
  }
  if (astResult.onExit) {
    config.onExit = getActionConfig(astResult.onExit, opts);
  }

  if (astResult.tags) {
    const tags = astResult.tags.map((tag) => tag.value);

    if (tags.length === 1) {
      config.tags = tags[0];
    } else {
      config.tags = tags;
    }
  }

  if (astResult.on) {
    config.on = {};

    astResult.on.properties.forEach((onProperty) => {
      (config.on as any)[onProperty.key] = getTransitions(
        onProperty.result,
        opts,
      );
    });
  }

  if (astResult.after) {
    config.after = {};

    astResult.after.properties.forEach((afterProperty) => {
      (config.after as any)[afterProperty.key] = getTransitions(
        afterProperty.result,
        opts,
      );
    });
  }

  if (astResult.history) {
    config.history = astResult.history.value;
  }

  if (astResult.states) {
    const states: typeof config.states = {};

    astResult.states.properties.forEach((state) => {
      states[state.key] = parseStateNode(state.result, opts);
    });

    config.states = states;
  }

  if (astResult.always) {
    config.always = getTransitions(astResult.always, opts);
  }

  if (astResult.meta?.description) {
    config.meta = {
      description: astResult.meta.description.value,
    };
  }

  if (astResult.onDone) {
    config.onDone = getTransitions(astResult.onDone, opts) as any[];
  }

  if (astResult.description) {
    config.description = astResult.description.value;
  }

  if (astResult.invoke) {
    const invokes: typeof config.invoke = [];

    astResult.invoke.forEach((invoke) => {
      if (!invoke.src) {
        return;
      }
      // For now, we'll treat "anonymous" as if this is an inline expression
      let src: string | undefined =
        invoke.src.declarationType === 'named' ? invoke.src.value : undefined;

      const toPush: ExtractorInvokeNodeConfig = {
        src: src || (() => () => {}),
      };

      if (invoke.id) {
        toPush.id = invoke.id.value;
      }

      if (invoke.autoForward) {
        toPush.autoForward = invoke.autoForward.value;
      }

      if (invoke.forward) {
        toPush.forward = invoke.forward.value;
      }

      if (invoke.onDone) {
        toPush.onDone = getTransitions(invoke.onDone, opts) as any[];
      }

      if (invoke.onError) {
        toPush.onError = getTransitions(invoke.onError, opts) as any[];
      }

      invokes.push(toPush);
    });

    if (invokes.length === 1) {
      config.invoke = invokes[0];
    } else {
      config.invoke = invokes;
    }
  }

  return config;
};

const parseRootStateNode = (
  astResult: StateNodeReturn,
  opts: ToMachineConfigOptions | undefined,
): ExtractorStateNodeConfig => {
  const config: ExtractorMachineConfig = parseStateNode(astResult, opts);
  if (t.isObjectExpression(astResult.context?.node)) {
    config.context = extractObjectRecursively(
      astResult.context!.node,
      opts!.fileContent,
    );
  } else if (astResult.context) {
    config.context = toJsonExpressionString(
      opts!.fileContent.slice(
        astResult.context.node.start!,
        astResult.context.node.end!,
      ),
    );
  }
  return config;
};

export const toMachineConfig = (
  result: TMachineCallExpression,
  opts?: ToMachineConfigOptions,
): ExtractorMachineConfig | undefined => {
  if (!result?.definition) return undefined;
  return parseRootStateNode(result?.definition, opts);
};

export const getActionConfig = (
  astActions: GetParserResult<typeof MaybeArrayOfActions>,
  opts: ToMachineConfigOptions | undefined,
) => {
  const actions: ExtractorMachineAction[] = [];

  // Todo: think about error reporting and how to handle invalid actions such as raise(2)
  astActions.forEach((action) => {
    switch (action.kind) {
      case 'named':
        if (action.declarationType === 'object') {
          actions.push({
            kind: action.kind,
            action: {
              type: action.name,
              // Extracts the rest of action object properties including params, etc
              // TODO: Should we only allow params?
              ...(extractObjectRecursively(
                action.node as t.ObjectExpression,
                opts!.fileContent,
              ) as Record<string, JsonItem>),
            },
          });
        } else {
          actions.push({
            kind: action.kind,
            action: { type: action.name, params: {} },
          });
        }
        return;
      case 'inline':
        const __tempStatelyChooseConds =
          action.name === 'choose'
            ? action.chooseConditions!.map((condition) => {
                const cond = getCondition(condition.conditionNode, opts);
                return {
                  ...(cond && { cond }),
                  // TODO: extract cond.actions with getActionConfig
                  actions: condition.actionNodes.map((node) => node.action),
                };
              })
            : [];
        actions.push({
          kind: action.kind,
          action: {
            expr: toJsonExpressionString(
              opts!.fileContent.slice(action.node.start!, action.node.end!),
            ),
            ...(__tempStatelyChooseConds.length > 0 && {
              __tempStatelyChooseConds,
            }),
          },
        });
        return;
      case 'builtin':
        switch (action.name) {
          case 'assign': {
            actions.push({
              kind: action.kind,
              action: {
                type: 'xstate.assign',
                assignment: extractAssignAction(action, opts!.fileContent),
              },
            });
            return;
          }
          case 'raise': {
            actions.push({
              kind: action.kind,
              action: {
                type: 'xstate.raise',
                event: extractRaiseAction(action, opts!.fileContent),
              },
            });
            return;
          }
          case 'log': {
            actions.push({
              kind: action.kind,
              action: {
                type: 'xstate.log',
                expr: extractLogAction(action, opts!.fileContent),
              },
            });
            return;
          }
          case 'sendTo': {
            actions.push({
              kind: action.kind,
              action: {
                type: 'xstate.sendTo',
                ...extractSendToAction(action, opts!.fileContent),
              },
            });
            return;
          }
          case 'stop': {
            actions.push({
              kind: action.kind,
              action: {
                type: 'xstate.stop',
                id: extractStopAction(action, opts!.fileContent),
              },
            });
            return;
          }
        }
        return;
      default:
        console.error(action);
        throw Error('Unsupported kind property on parsed action');
    }
  });

  if (actions.length === 1) {
    return actions[0];
  }

  return actions;
};

const getCondition = (
  condNode: CondNode | undefined,
  opts: ToMachineConfigOptions | undefined,
): ExtractorMachineGuard | undefined => {
  if (!condNode) {
    return;
  }
  switch (condNode.kind) {
    case 'named': {
      const guard: ExtractorNamedGuard['guard'] = {
        type: condNode.name,
      };
      if (t.isObjectExpression(condNode.node)) {
        let paramsNode: t.ObjectExpression | undefined = undefined;
        for (const val of condNode.node.properties) {
          if (
            t.isObjectExpression(val) &&
            getObjectPropertyKey(val) === 'params'
          ) {
            paramsNode = val;
          }
        }
        if (paramsNode) {
          guard.params = extractObjectRecursively(
            paramsNode,
            opts!.fileContent,
          );
        }
      }
      return {
        kind: 'named',
        guard,
      };
    }
    case 'inline': {
      return {
        kind: 'inline',
        guard: {
          expr: toJsonExpressionString(
            opts!.fileContent.slice(condNode.node.start!, condNode.node.end!),
          ),
        },
      };
    }
  }
  // return condNode.declarationType === 'named' ? condNode.name : undefined;
};

export const getTransitions = (
  astTransitions: GetParserResult<typeof MaybeTransitionArray>,
  opts: ToMachineConfigOptions | undefined,
): MaybeArray<ExtractrorTransitionNodeConfig> => {
  const transitions: ExtractrorTransitionNodeConfig[] = [];

  astTransitions?.forEach((transition) => {
    const toPush: ExtractrorTransitionNodeConfig = {};
    if (transition?.target && transition?.target?.length > 0) {
      if (transition.target.length === 1) {
        toPush.target = transition?.target[0].value;
      } else {
        toPush.target = transition?.target.map((target) => target.value);
      }
    }
    const cond = getCondition(transition?.cond, opts);
    if (cond) {
      toPush.cond = cond;
    }
    if (transition?.actions) {
      toPush.actions = getActionConfig(transition.actions, opts);
    }
    if (transition?.description) {
      toPush.description = transition?.description.value;
    }
    // Only add `internal` if its present
    if (typeof transition.internal?.value === 'boolean') {
      toPush.internal = transition.internal.value;
    }

    transitions.push(toPush);
  });

  if (transitions.length === 1) {
    return transitions[0];
  }

  return transitions;
};
