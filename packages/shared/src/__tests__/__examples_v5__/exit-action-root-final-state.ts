import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./exit-action-root-final-state.typegen').Typegen0,
  exit: 'rootExit',
  initial: 'a',
  states: {
    a: {
      on: {
        TICK: 'b',
      },
    },
    b: {
      type: 'final',
      exit: 'finalExit',
    },
  },
});
