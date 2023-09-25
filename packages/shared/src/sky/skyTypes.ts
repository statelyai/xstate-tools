import { AnyStateMachine as AnyStateMachine4 } from 'xstate';
import { AnyStateMachine as AnyStateMachine5 } from 'xstate-beta';

export type SkyAnyStateMachine = AnyStateMachine4 | AnyStateMachine5;

// TODO: consume these from the Sky SDK package once that's released
export interface SkyConfig {
  config: any;
  actor: { id: string };
  prettyConfigString: string;
}

export interface SkyConfigFile<T extends SkyAnyStateMachine> {
  machine: T;
  actorId: string;
}
