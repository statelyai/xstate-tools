import { MachineExtractResult } from '@xstate/machine-extractor';
import { AnyStateMachine, createMachine } from 'xstate';
import { forEachMachineEntity } from './forEachMachineEntity';

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

  forEachMachineEntity(config, (entity) => {
    if (entity?.kind === 'named' && 'action' in entity) {
      return entity.action;
    }
    // Special case choose actions for typegen
    if (
      entity?.kind === 'inline' &&
      'action' in entity &&
      entity.action.__tempStatelyChooseConds
    ) {
      return {
        type: 'xstate.choose',
        conds: entity.action.__tempStatelyChooseConds,
      };
    }
    // Guards
    if (entity?.kind === 'named' && 'guard' in entity) {
      return entity.guard.type;
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
