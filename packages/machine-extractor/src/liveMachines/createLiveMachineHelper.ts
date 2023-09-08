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
  fetchedConfig?: FetchedSkyConfigFile<T>,
) => {
  if (!fetchedConfig) {
    throw new Error(
      `You need to run xstate generate "src/**/*.ts?(x)" before you can use the Stately Sky actor with id ${machineVersionId}`,
    );
  }
  return fetchedConfig.machine;
};
