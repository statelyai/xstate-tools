import {
  ExtractorGuard,
  ExtractorInvokeNodeConfig,
  ExtractorMachineAction,
  ExtractorNamedAction,
  MachineExtractResult,
} from '@xstate/machine-extractor';
import { AnyStateMachine, createMachine } from 'xstate';
import { forEachEntity } from './forEachEntity';

function stubAllWith<T>(value: T): Record<string, T> {
  return new Proxy(
    {},
    {
      get: () => value,
    },
  );
}

export const isActorEntity = (
  entity: any,
): entity is ExtractorInvokeNodeConfig =>
  !!entity && 'src' in entity && typeof entity.src !== 'undefined';
export const isActionEntity = (entity: any): entity is ExtractorMachineAction =>
  !!entity && 'action' in entity && typeof entity.action !== 'undefined';

export function createIntrospectableMachine(
  machineResult: MachineExtractResult,
): AnyStateMachine {
  const config = machineResult.toConfig()!;

  forEachEntity(config, (entity) => {
    // Actors
    if (isActorEntity(entity)) {
      return {
        ...entity,
        src: entity.kind === 'inline' ? () => {} : entity.src,
      };
    }
    // Actions
    if (isActionEntity(entity)) {
      if (entity?.kind === 'named') {
        return entity.action;
      }
      // Special case choose actions for typegen
      else if (
        entity?.kind === 'inline' &&
        entity.action.__tempStatelyChooseConds
      ) {
        return {
          type: 'xstate.choose',
          conds: entity.action.__tempStatelyChooseConds,
        };
      }
      return;
    }

    // Guards
    // inline guards can be ignored
    if (entity?.kind === 'named') {
      return entity.type;
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
