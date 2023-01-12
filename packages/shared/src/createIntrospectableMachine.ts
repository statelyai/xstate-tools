import { MachineExtractResult } from '@xstate/machine-extractor';
import { AnyStateMachine, createMachine } from 'xstate';

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
  // xstate-ignore-next-line
  return createMachine(
    {
      ...machineResult.toConfig(),
      context: {},
      predictableActionArguments: true,
    },
    {
      guards: stubAllWith(() => false),
      actions: machineResult.getChooseActionsToAddToOptions(),
    },
  );
}
