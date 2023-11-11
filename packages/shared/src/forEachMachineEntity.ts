import {
  ExtractorInvokeNodeConfig,
  ExtractorMachineAction,
  ExtractorMachineConfig,
  ExtractorMachineGuard,
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

const replaceOrDeleteEntities = <T>(
  host: T,
  prop: keyof T,
  visitor: Visitor,
) => {
  const entity = host[prop] as MaybeArray<
    ExtractorMachineAction | ExtractorMachineGuard
  >;
  if (Array.isArray(entity)) {
    for (let i = entity.length - 1; i >= 0; i--) {
      const original = entity[i];
      // Run visitor on guards inside choose actions
      if (
        original?.kind === 'inline' &&
        'action' in original &&
        original.action.__tempStatelyChooseConds
      ) {
        original.action.__tempStatelyChooseConds.forEach((conds, i, arr) => {
          arr[i].cond = visitor(conds.cond);
        });
      }

      const val = visitor(original);
      if (val) {
        entity[i] = val;
      } else {
        entity.splice(i, 1);
      }
    }
  } else {
    // Run visitor on guards inside choose actions
    if (
      entity?.kind === 'inline' &&
      'action' in entity &&
      entity.action.__tempStatelyChooseConds
    ) {
      entity.action.__tempStatelyChooseConds.forEach((conds, i, arr) => {
        arr[i].cond = visitor(conds.cond);
      });
    }
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
const forEachMachineEntityRecur = (
  stateNode: ExtractorStateNodeConfig,
  visitor: Visitor,
  path: string[],
) => {
  /**
   * Entry actions
   */
  replaceOrDeleteEntities(stateNode, 'entry', visitor);
  /**
   * Exit actions
   */
  replaceOrDeleteEntities(stateNode, 'exit', visitor);

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
            replaceOrDeleteEntities(doneTransition, 'actions', visitor);
          });
        } else {
          const doneTransition = invocation.onDone;
          if (!doneTransition?.actions) return;
          replaceOrDeleteEntities(doneTransition, 'actions', visitor);
        }
      } else {
        const invocation = stateNode.invoke;
        if (!invocation) return;
        if (Array.isArray(invocation.onDone)) {
          invocation.onDone.forEach((doneTransition) => {
            replaceOrDeleteEntities(doneTransition, 'actions', visitor);
          });
        } else {
          const doneTransition = invocation.onDone;
          if (!doneTransition?.actions) return;
          replaceOrDeleteEntities(doneTransition, 'actions', visitor);
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
            replaceOrDeleteEntities(errorTransition, 'actions', visitor);
          });
        } else {
          const errorTransition = invocation.onError;
          if (!errorTransition?.actions) return;
          replaceOrDeleteEntities(errorTransition, 'actions', visitor);
        }
      } else {
        const invocation = stateNode.invoke;
        if (!invocation) return;
        if (Array.isArray(invocation.onError)) {
          invocation.onError.forEach((errorTransition) => {
            replaceOrDeleteEntities(errorTransition, 'actions', visitor);
          });
        } else {
          const errorTransition = invocation.onError;
          if (!errorTransition?.actions) return;
          replaceOrDeleteEntities(errorTransition, 'actions', visitor);
        }
      }
    }
    // Guarded transitions
    else if (Array.isArray(tr)) {
      tr.forEach((group) => {
        replaceOrDeleteEntities(group, 'actions', visitor);
        replaceOrDeleteEntities(group, 'cond', visitor);
      });
    } else {
      replaceOrDeleteEntities(tr, 'actions', visitor);
      replaceOrDeleteEntities(tr, 'cond', visitor);
    }
  });
  /**
   * Recurse to child states
   */
  for (const key in stateNode.states) {
    forEachMachineEntityRecur(stateNode.states[key], visitor, path.concat(key));
  }
};

export const forEachMachineEntity = (
  machine: ExtractorMachineConfig,
  visitor: Visitor,
) => {
  return forEachMachineEntityRecur(machine, visitor, ['machine']);
};

type Visitor = (
  entity: ExtractorMachineAction | ExtractorMachineGuard | undefined,
) => any;
