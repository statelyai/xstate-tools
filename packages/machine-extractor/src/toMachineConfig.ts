import {
  Actions,
  MachineConfig,
  StateNodeConfig,
  TransitionConfigOrTarget,
} from "xstate";
import { MaybeArrayOfActions } from "./actions";
import { TMachineCallExpression } from "./machineCallExpression";
import { StateNodeReturn } from "./stateNode";
import { MaybeTransitionArray } from "./transitions";
import { GetParserResult } from "./utils";

export interface ToMachineConfigParseOptions {
  /**
   * Whether or not to hash inline implementations, which
   * allow for parsing inline implementations as code.
   *
   * @default false
   */
  hashInlineImplementations?: boolean;
}

const parseStateNode = (
  astResult: StateNodeReturn,
  opts?: ToMachineConfigParseOptions,
): StateNodeConfig<any, any, any> => {
  const config: MachineConfig<any, any, any> = {};

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
      states[state.key] = parseStateNode(state.result);
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
    // @ts-ignore
    config.onDone = getTransitions(astResult.onDone);
  }

  if (astResult.description) {
    config.description = astResult.description.value;
  }

  if (astResult.invoke) {
    const invokes: typeof config.invoke = [];

    astResult.invoke.forEach((invoke) => {
      if (!invoke.src) return;
      let src: string;
      if (opts?.hashInlineImplementations) {
        src =
          invoke.src.declarationType === "named"
            ? invoke.src.value
            : invoke.src.inlineDeclarationId;
      } else {
        src = invoke.src.value;
      }
      const toPush: typeof invokes[number] = {
        src,
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
        // @ts-ignore
        toPush.onDone = getTransitions(invoke.onDone);
      }

      if (invoke.onError) {
        // @ts-ignore
        toPush.onError = getTransitions(invoke.onError);
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
  opts?: ToMachineConfigParseOptions,
): MachineConfig<any, any, any> | undefined => {
  if (!result?.definition) return undefined;
  return parseStateNode(result?.definition, opts);
};

export const getActionConfig = (
  astActions: GetParserResult<typeof MaybeArrayOfActions>,
  opts: ToMachineConfigParseOptions | undefined,
): Actions<any, any> => {
  const actions: Actions<any, any> = [];

  astActions?.forEach((action) => {
    if (opts?.hashInlineImplementations && action.declarationType !== "named") {
      actions.push({
        type: action.inlineDeclarationId,
      });
    } else {
      actions.push(action.action);
    }
  });

  if (actions.length === 1) {
    return actions[0];
  }

  return actions;
};

export const getTransitions = (
  astTransitions: GetParserResult<typeof MaybeTransitionArray>,
  opts: ToMachineConfigParseOptions | undefined,
): TransitionConfigOrTarget<any, any> => {
  const transitions: TransitionConfigOrTarget<any, any> = [];

  astTransitions?.forEach((transition) => {
    const toPush: TransitionConfigOrTarget<any, any> = {};
    if (transition?.target && transition?.target?.length > 0) {
      if (transition.target.length === 1) {
        toPush.target = transition?.target[0].value;
      } else {
        toPush.target = transition?.target.map((target) => target.value);
      }
    }
    if (transition?.cond) {
      if (
        opts?.hashInlineImplementations &&
        transition.cond.declarationType !== "named"
      ) {
        toPush.cond = transition.cond.inlineDeclarationId;
      } else {
        toPush.cond = transition?.cond.cond;
      }
    }
    if (transition?.actions) {
      toPush.actions = getActionConfig(transition.actions, opts);
    }

    transitions.push(toPush);
  });

  if (transitions.length === 1) {
    return transitions[0];
  }

  return transitions;
};
