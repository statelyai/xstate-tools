import { FetchedSkyConfigFile } from '@xstate/tools-shared';
import { AnyStateMachine } from 'xstate';

export const createLiveMachine = <T extends AnyStateMachine>(
  {
    apiKey,
    machineVersionId,
  }: {
    apiKey?: string;
    machineVersionId: string;
  },
  fetchedConfig: FetchedSkyConfigFile<T>,
) => {
  return fetchedConfig.machine;
};
