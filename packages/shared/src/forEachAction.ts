import {
  ExtractorInvokeNodeConfig,
  ExtractorMachineAction,
  ExtractorMachineConfig,
  ExtractorStateNodeConfig,
  ExtractrorTransitionNodeConfig,
  MaybeArray,
} from '@xstate/machine-extractor';

const getMaybeArrayAsArray = <T>(maybeArray: MaybeArray<T>): T[] => {
  if (Array.isArray(maybeArray)) {
    return maybeArray;
  }
  return [maybeArray];
};

function getInvokeId(
  nodeId: string,
  invoke: ExtractorInvokeNodeConfig,
  index: number,
): string {
  return invoke.id ?? `${nodeId}:invocation[${index}]`;
}

function getDelayedTransitionKey(
  delay: number | string,
  serializableId: string,
): string {
  return `xstate.after(${delay})#${serializableId}`;
}

function getTransitionsOutOfState(
  stateNode: ExtractorStateNodeConfig,
  serializableId: string,
): Record<string, MaybeArray<ExtractrorTransitionNodeConfig>> {
  const transitions: Record<
    string,
    MaybeArray<ExtractrorTransitionNodeConfig>
  > = {
    ...stateNode.on,
  };

  if (stateNode.onDone) {
    transitions[`done.state.${serializableId}`] = stateNode.onDone;
  }

  if (stateNode.always) {
    transitions[''] = stateNode.always;
  }

  if (stateNode.after) {
    for (const delay in stateNode.after) {
      transitions[getDelayedTransitionKey(delay, serializableId)] =
        stateNode.after[delay];
    }
  }

  getMaybeArrayAsArray(stateNode.invoke).forEach((invoke, index) => {
    if (!invoke) return;
    getMaybeArrayAsArray(invoke.onDone).forEach((doneTransition) => {
      if (!doneTransition) return;
      transitions[`done.invoke.${getInvokeId(serializableId, invoke, index)}`] =
        {
          ...doneTransition,
          target: doneTransition.target ?? serializableId,
        };
    });
    getMaybeArrayAsArray(invoke.onError).forEach((errorTransition) => {
      if (!errorTransition) return;
      transitions[
        `error.invoke.${getInvokeId(serializableId, invoke, index)}`
      ] = {
        ...errorTransition,
        target: errorTransition.target ?? serializableId,
      };
    });
  });

  return transitions;
}

const replaceOrDeleteActions = <T>(
  host: T,
  prop: keyof T,
  visitor: (action: ExtractorMachineAction | undefined) => any,
) => {
  const entity = host[prop] as MaybeArray<ExtractorMachineAction>;
  if (Array.isArray(entity)) {
    for (let i = 0; i < entity.length; i++) {
      const val = visitor(entity[i]);
      if (val) {
        entity[i] = val;
      } else {
        entity.splice(i, 1);
      }
    }
  } else {
    const val = visitor(entity);
    if (val) {
      host[prop] = val;
    } else {
      delete host[prop];
    }
  }
};

/**
 * @description Recursively traverses the state node, finds all actions and either replaces them with the new value is visitor returns a truthy value or deletes it
 */
const forEachActionRecur = (
  stateNode: ExtractorStateNodeConfig,
  visitor: (action: ExtractorMachineAction | undefined) => any,
  path: string[],
) => {
  /**
   * Entry actions
   */
  replaceOrDeleteActions(stateNode, 'entry', visitor);
  /**
   * Exit actions
   */
  replaceOrDeleteActions(stateNode, 'exit', visitor);

  const transitions = getTransitionsOutOfState(stateNode, path.join('.'));
  Object.entries(transitions).forEach(([event, tr]) => {
    /**
     * invoke.onDone transitions
     */
    if (event.startsWith('done.invoke')) {
      const index = parseInt(
        event.replace(/done\.invoke\..+:invocation\[(\d+)\]/, '$1'),
        10,
      );
      if (Array.isArray(stateNode.invoke)) {
        const invocation = stateNode.invoke[index];
        if (Array.isArray(invocation.onDone)) {
          invocation.onDone.forEach((doneTransition) => {
            replaceOrDeleteActions(doneTransition, 'actions', visitor);
          });
        } else {
          const doneTransition = invocation.onDone;
          if (!doneTransition?.actions) return;
          replaceOrDeleteActions(doneTransition, 'actions', visitor);
        }
      } else {
        const invocation = stateNode.invoke;
        if (!invocation) return;
        if (Array.isArray(invocation.onDone)) {
          invocation.onDone.forEach((doneTransition) => {
            replaceOrDeleteActions(doneTransition, 'actions', visitor);
          });
        } else {
          const doneTransition = invocation.onDone;
          if (!doneTransition?.actions) return;
          replaceOrDeleteActions(doneTransition, 'actions', visitor);
        }
      }
    } else if (event.startsWith('error.invoke')) {
      /**
       * invoke.onError transitions
       */
      const index = parseInt(
        event.replace(/error\.invoke\..+:invocation\[(\d+)\]/, '$1'),
        10,
      );
      if (Array.isArray(stateNode.invoke)) {
        const invocation = stateNode.invoke[index];
        if (Array.isArray(invocation.onError)) {
          invocation.onError.forEach((errorTransition) => {
            replaceOrDeleteActions(errorTransition, 'actions', visitor);
          });
        } else {
          const errorTransition = invocation.onError;
          if (!errorTransition?.actions) return;
          replaceOrDeleteActions(errorTransition, 'actions', visitor);
        }
      } else {
        const invocation = stateNode.invoke;
        if (!invocation) return;
        if (Array.isArray(invocation.onError)) {
          invocation.onError.forEach((errorTransition) => {
            replaceOrDeleteActions(errorTransition, 'actions', visitor);
          });
        } else {
          const errorTransition = invocation.onError;
          if (!errorTransition?.actions) return;
          replaceOrDeleteActions(errorTransition, 'actions', visitor);
        }
      }
    }
    // Guarded transitions
    else if (Array.isArray(tr)) {
      tr.forEach((group) => {
        replaceOrDeleteActions(group, 'actions', visitor);
      });
    } else {
      replaceOrDeleteActions(tr, 'actions', visitor);
    }
  });
  /**
   * Recurse to child states
   */
  for (const key in stateNode.states) {
    forEachActionRecur(stateNode.states[key], visitor, path.concat(key));
  }
};

export const forEachAction = (
  machine: ExtractorMachineConfig,
  visitor: (action: ExtractorMachineAction | undefined) => any,
) => {
  return forEachActionRecur(machine, visitor, ['machine']);
};
