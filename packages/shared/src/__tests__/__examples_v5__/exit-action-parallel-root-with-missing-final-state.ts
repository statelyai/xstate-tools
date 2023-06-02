import { createMachine } from 'xstate5';

createMachine({
  tsTypes:
    {} as import('./exit-action-parallel-root-with-missing-final-state.typegen').Typegen0,
  exit: 'rootExit',
  type: 'parallel',
  states: {
    a: {
      exit: 'aExit',
      initial: 'a1',
      states: {
        a1: {
          on: {
            TICK_A: 'a2',
          },
        },
        a2: {
          type: 'final',
        },
      },
    },
    b: {
      exit: 'bExit',
      initial: 'b1',
      states: {
        b1: {
          on: {
            TICK_B: 'b2',
          },
        },
        b2: {},
      },
    },
  },
});
