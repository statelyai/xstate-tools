import {
  Actions,
  MachineConfig,
  StateNodeConfig,
  TransitionConfigOrTarget,
} from 'xstate';
import { ActionNode, MaybeArrayOfActions } from './actions';
import { CondNode } from './conds';
import {
  extractAssignment,
  extractLogExpression,
  extractNamedActionImplementation,
  extractRaisedEvent,
  extractSendToProperties,
  extractStopProperties,
  isBuiltinActionWithName,
} from './extractAction';
import { TMachineCallExpression } from './machineCallExpression';
import { StateNodeReturn } from './stateNode';
import { MaybeTransitionArray } from './transitions';
import { GetParserResult } from './utils';

export interface ToMachineConfigOptions {
  /**
   * Whether or not to hash inline implementations, which
   * allow for parsing inline implementations as code.
   *
   * @default false
   */
  hashInlineImplementations?: boolean;

  /**
   * Whether to use a static string in place of inline implementations.
   * This makes it easier to compare two different configs with `deepEqual`
   *
   * @default false
   */
  anonymizeInlineImplementations?: boolean;
  /**
   * Original source code text
   */
  fileContent: string;
}

const parseStateNode = (
  astResult: TMachineCallExpression,
  astDefinition: StateNodeReturn,
  opts: ToMachineConfigOptions | undefined,
): StateNodeConfig<any, any, any> => {
  const config: MachineConfig<any, any, any> = {};

  if (astDefinition?.id) {
    config.id = astDefinition.id.value;
  }

  if (astDefinition?.initial) {
    config.initial = astDefinition.initial.value;
  }

  if (astDefinition?.type) {
    config.type = astDefinition.type.value as any;
  }

  if (astDefinition.entry) {
    config.entry = getActionConfig(astResult, astDefinition.entry, opts);
  }
  if (astDefinition.onEntry) {
    config.onEntry = getActionConfig(astResult, astDefinition.onEntry, opts);
  }
  if (astDefinition.exit) {
    config.exit = getActionConfig(astResult, astDefinition.exit, opts);
  }
  if (astDefinition.onExit) {
    config.onExit = getActionConfig(astResult, astDefinition.onExit, opts);
  }

  if (astDefinition.tags) {
    const tags = astDefinition.tags.map(tag => tag.value);

    if (tags.length === 1) {
      config.tags = tags[0];
    } else {
      config.tags = tags;
    }
  }

  if (astDefinition.on) {
    config.on = {};

    astDefinition.on.properties.forEach(onProperty => {
      (config.on as any)[onProperty.key] = getTransitions(
        onProperty.result,
        opts,
      );
    });
  }

  if (astDefinition.after) {
    config.after = {};

    astDefinition.after.properties.forEach(afterProperty => {
      (config.after as any)[afterProperty.key] = getTransitions(
        afterProperty.result,
        opts,
      );
    });
  }

  if (astDefinition.history) {
    config.history = astDefinition.history.value;
  }

  if (astDefinition.states) {
    const states: typeof config.states = {};

    astDefinition.states.properties.forEach(state => {
      states[state.key] = parseStateNode(astResult, state.result, opts);
    });

    config.states = states;
  }

  if (astDefinition.always) {
    config.always = getTransitions(astDefinition.always, opts);
  }

  if (astDefinition.meta?.description) {
    config.meta = {
      description: astDefinition.meta.description.value,
    };
  }

  if (astDefinition.onDone) {
    config.onDone = getTransitions(astDefinition.onDone, opts) as any[];
  }

  if (astDefinition.description) {
    config.description = astDefinition.description.value;
  }

  if (astDefinition.invoke) {
    const invokes: typeof config.invoke = [];

    astDefinition.invoke.forEach(invoke => {
      if (!invoke.src) {
        return;
      }
      let src: string | undefined;

      switch (true) {
        case invoke.src.declarationType === 'named':
          src = invoke.src.value;
          break;
        case opts?.anonymizeInlineImplementations:
          src = 'anonymous';
        case opts?.hashInlineImplementations:
          src = invoke.src.inlineDeclarationId;
      }

      const toPush: typeof invokes[number] = {
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

export const toMachineConfig = (
  result: TMachineCallExpression,
  opts?: ToMachineConfigOptions,
): MachineConfig<any, any, any> | undefined => {
  if (!result?.definition) return undefined;
  return parseStateNode(result, result.definition, opts);
};

export const getActionConfig = (
  astResult: TMachineCallExpression,
  astActions: GetParserResult<typeof MaybeArrayOfActions>,
  opts: ToMachineConfigOptions | undefined,
): Actions<any, any> => {
  const actions: Actions<any, any> = [];

  astActions?.forEach(action => {
    switch (true) {
      case action.declarationType === 'named':
        actions.push(action.name);
        const val = astResult.options?.actions?.properties.find(
          prop => prop.key === action.name,
        )!;
        console.log(
          val.result.node,
          extractNamedActionImplementation(val.result.node, opts!.fileContent),
        );
      case opts?.anonymizeInlineImplementations:
        actions.push({
          type: 'anonymous',
        });
        return;
      case opts?.hashInlineImplementations:
        actions.push({
          type: action.inlineDeclarationId,
        });
        return;
      case !!action.chooseConditions:
        actions.push({
          type: 'xstate.choose',
          conds: action.chooseConditions!.map(condition => {
            const cond = getCondition(condition.conditionNode, opts);
            return {
              ...(cond && { cond }),
              actions: getActionConfig(astResult, condition.actionNodes, opts),
            };
          }),
        });
        return;
      case isBuiltinActionWithName(action, 'assign'):
        actions.push({
          type: action.name || `Assignment ${Math.random().toFixed(3)}`,
          name: 'xstate.assign',
          assignment: extractAssignment(action, opts!.fileContent),
        });
        return;
      case isBuiltinActionWithName(action, 'raise'):
        actions.push({
          type: action.name || `Raise ${Math.random().toFixed(3)}`,
          name: 'xstate.raise',
          event: extractRaisedEvent(action, opts!.fileContent),
        });
        return;
      case isBuiltinActionWithName(action, 'log'):
        actions.push({
          type: action.name || `Log ${Math.random().toFixed(3)}`,
          name: 'xstate.log',
          expr: extractLogExpression(action, opts!.fileContent),
        });
        return;
      case isBuiltinActionWithName(action, 'sendTo'):
        actions.push({
          type: action.name || `SendTo ${Math.random().toFixed(3)}`,
          name: 'xstate.sendTo',
          expr: extractSendToProperties(action, opts!.fileContent),
        });
        return;
      case isBuiltinActionWithName(action, 'stop'):
        actions.push({
          type: action.name || `Stop ${Math.random().toFixed(3)}`,
          name: 'xstate.stop',
          expr: extractStopProperties(action, opts!.fileContent),
        });
        return;
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
) => {
  if (!condNode) {
    return;
  }
  switch (true) {
    case condNode.declarationType === 'named':
      return condNode.name;
    case opts?.anonymizeInlineImplementations:
      return 'anonymous';
    case opts?.hashInlineImplementations:
      return condNode.inlineDeclarationId;
  }
};

export const getTransitions = (
  astTransitions: GetParserResult<typeof MaybeTransitionArray>,
  opts: ToMachineConfigOptions | undefined,
): TransitionConfigOrTarget<any, any> => {
  const transitions: TransitionConfigOrTarget<any, any> = [];

  astTransitions?.forEach(transition => {
    const toPush: TransitionConfigOrTarget<any, any> = {};
    if (transition?.target && transition?.target?.length > 0) {
      if (transition.target.length === 1) {
        toPush.target = transition?.target[0].value;
      } else {
        toPush.target = transition?.target.map(target => target.value);
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

    transitions.push(toPush);
  });

  if (transitions.length === 1) {
    return transitions[0];
  }

  return transitions;
};
