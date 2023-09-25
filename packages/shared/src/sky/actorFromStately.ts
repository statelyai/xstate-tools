import { interpret } from 'xstate';
import { createActor } from 'xstate-beta';
import { AnyStateMachine4, AnyStateMachine5, SkyConfigFile } from './skyTypes';

export function actorFromStately<T extends AnyStateMachine4 | AnyStateMachine5>(
  {
    apiKey,
    url,
    xstateVersion = '5',
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
  switch (xstateVersion) {
    case '4':
      return interpret(skyConfig.machine as AnyStateMachine4);
    case '5':
      return createActor(skyConfig.machine as AnyStateMachine5);
  }
}
