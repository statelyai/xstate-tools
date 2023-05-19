import { AnyStateMachine } from 'xstate';

// TODO: use this from the Connect SDK package once that's released
export interface SkyConfig {
  config: any;
  workflow: { id: string };
  prettyConfigString: string;
}

export interface FetchedSkyConfigFile<T extends AnyStateMachine> {
  fetchedMachine: T;
  workflowId: string;
}
