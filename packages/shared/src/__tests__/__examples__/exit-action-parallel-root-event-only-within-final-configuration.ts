import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./exit-action-parallel-root-event-only-within-final-configuration.typegen').Typegen0,
  exit: 'rootExit',
  type: 'parallel',
  states: {
    a: {
      exit: 'aExit',
      states: {
        a1: {
          exit: 'a1Exit',
          on: {
            TICK_A1: 'a2',
          },
        },
        a2: {
          exit: 'a2Exit',
          on: {
            TICK_A2: 'a3',
          },
        },
        a3: {
          exit: 'a3Exit',
          type: 'final',
        },
      },
    },
    b: {
      exit: 'bExit',
      states: {
        b1: {
          exit: 'b1Exit',
          on: {
            TICK_B1: 'b2',
          },
        },
        b2: {
          exit: 'b2Exit',
          on: {
            TICK_B2: 'b3',
          },
        },
        b3: {
          exit: 'b3Exit',
          type: 'final',
        },
      },
    },
  },
});
