import { AnyStateMachine } from 'xstate';

// TODO: use this from the Connect SDK package once that's released
export interface SkyConfig {
  config: any;
  actor: { id: string };
  prettyConfigString: string;
}

export interface SkyConfigFile<T extends AnyStateMachine> {
  machine: T;
  actorId: string;
}
