import { MachineParseResult } from '@xstate/machine-extractor';
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
  machineResult: MachineParseResult,
): AnyStateMachine {
  // xstate-ignore-next-line
  return createMachine(
    {
      ...machineResult.toConfig(),
      context: {},
    },
    {
      guards: stubAllWith(() => false),
      actions: machineResult.getChooseActionsToAddToOptions(),
    },
  );
}
