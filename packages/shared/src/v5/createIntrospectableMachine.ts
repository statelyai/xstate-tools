import { MachineExtractResult } from '@xstate/machine-extractor';
import { AnyStateMachine, createMachine } from 'xstate5';

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
    } as any,
    {
      guards: stubAllWith(() => false),
      actions: machineResult.getChooseActionsToAddToOptions(),
    },
  );
}
