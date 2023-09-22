import { SkyConfigFile } from '@xstate/tools-shared';
import { AnyStateMachine } from 'xstate';

export const fetchFromStately = <T extends AnyStateMachine>(
  {
    apiKey,
    url,
  }: {
    apiKey?: string;
    url: string;
  },
  skyConfig?: SkyConfigFile<T>,
) => {
  if (!skyConfig) {
    throw new Error(
      `You need to run xstate connect "src/**/*.ts?(x)" before you can use the Stately Sky actor with id ${machineVersionId}`,
    );
  }
  return skyConfig.machine;
};
