import { SkyAnyStateMachine, SkyConfigFile } from './skyTypes';

export function machineFromStately<T extends SkyAnyStateMachine>(
  {
    apiKey,
    url,
    xstateVersion = '5', // Detect this from the version of the `@stately/sky` package
  }: {
    apiKey?: string;
    url: string;
    xstateVersion?: '4' | '5';
  },
  skyConfig?: SkyConfigFile<T>,
) {
  if (!skyConfig) {
    throw new Error(
      `You need to run xstate sky "src/**/*.ts?(x)" before you can use the Stately Sky actor with url ${url}`,
    );
  }
  return skyConfig.machine;
}
