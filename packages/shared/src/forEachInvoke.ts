import {
  ExtractorInvokeNodeConfig,
  ExtractorMachineAction,
  ExtractorMachineConfig,
  ExtractorStateNodeConfig,
  ExtractrorTransitionNodeConfig,
  MaybeArray,
} from '@xstate/machine-extractor';

/**
 * @description Recursively traverses the state node, finds all invocations and replace them with what the visitor returns
 */
const forEachInvokeRecur = (
  stateNode: ExtractorStateNodeConfig,
  visitor: (invoke: ExtractorInvokeNodeConfig) => any,
) => {
  if (stateNode.invoke) {
    if (Array.isArray(stateNode.invoke)) {
      for (let i = 0; i < stateNode.invoke.length; i++) {
        stateNode.invoke[i] = {
          ...stateNode.invoke[i],
          ...visitor(stateNode.invoke[i]),
        };
      }
    } else {
      stateNode.invoke = {
        ...stateNode.invoke,
        ...visitor(stateNode.invoke),
      };
    }
  }

  /**
   * Recurse to child states
   */
  for (const key in stateNode.states) {
    forEachInvokeRecur(stateNode.states[key], visitor);
  }
};

export const forEachInvoke = (
  machine: ExtractorMachineConfig,
  visitor: (invoke: ExtractorInvokeNodeConfig) => any,
) => {
  return forEachInvokeRecur(machine, visitor);
};
