import { MachineExtractResult } from '@xstate/machine-extractor';
import { AnyStateMachine, createMachine } from 'xstate';
import { forEachAction } from './forEachAction';

function stubAllWith<T>(value: T): Record<string, T> {
  return new Proxy(
    {},
    {
      get: () => value,
    },
  );
}

export function createIntrospectableMachine(
  machineResult: MachineExtractResult,
): AnyStateMachine {
  const config = machineResult.toConfig()!;

  forEachAction(config, (action) => {
    if (action?.kind === 'named') {
      return action.action;
    }
    // Special case choose actions for typegen
    if (action?.kind === 'inline' && action.action.__tempStatelyChooseConds) {
      return {
        type: 'xstate.choose',
        conds: action.action.__tempStatelyChooseConds,
      };
    }
    return;
  });
  // xstate-ignore-next-line
  return createMachine(
    {
      ...(config as any),
      context: {},
      predictableActionArguments: true,
    },
    {
      guards: stubAllWith(() => false),
      actions: machineResult.getChooseActionsToAddToOptions(),
    },
  );
}
