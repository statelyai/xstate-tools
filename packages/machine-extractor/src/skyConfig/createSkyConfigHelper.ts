import { SkyConfigFile } from '@xstate/tools-shared';
import { AnyStateMachine } from 'xstate';

export const fetchFromStately = <T extends AnyStateMachine>(
  {
    apiKey,
    url,
    xstateVersion,
  }: {
    apiKey?: string;
    url: string;
    xstateVersion?: '4' | '5';
  },
  skyConfig?: SkyConfigFile<T>,
) => {
  if (!skyConfig) {
    throw new Error(
      `You need to run xstate connect "src/**/*.ts?(x)" before you can use the Stately Sky actor with url ${url}`,
    );
  }
  return skyConfig.machine;
};
