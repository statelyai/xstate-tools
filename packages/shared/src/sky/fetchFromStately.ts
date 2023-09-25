import { AnyStateMachine } from 'xstate';
import { SkyConfigFile } from './skyTypes';

export function fetchFromStately<T extends AnyStateMachine>(
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
) {
  if (!skyConfig) {
    throw new Error(
      `You need to run xstate sky "src/**/*.ts?(x)" before you can use the Stately Sky actor with url ${url}`,
    );
  }
  return skyConfig.machine;
}
