import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./exit-action-root-multiple-final-states.typegen').Typegen0,
  exit: 'rootExit',
  initial: 'a',
  states: {
    a: {
      on: {
        TICK_B: 'b',
        TICK_C: 'c',
        TICK_D: 'd',
      },
    },
    b: {
      type: 'final',
      exit: 'bExit',
    },
    c: {
      type: 'final',
      exit: 'cExit',
    },
    d: {
      exit: 'dExit',
    },
  },
});
