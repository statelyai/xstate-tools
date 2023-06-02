import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./exit-action-parallel-root-with-mixed-states.typegen').Typegen0,
  exit: 'rootExit',
  type: 'parallel',
  states: {
    a: {
      type: 'parallel',
      exit: 'aExit',
      states: {
        a1: {
          initial: 'a11',
          states: {
            a11: {
              on: {
                TICK_A11: 'a12',
              },
            },
            a12: {
              exit: 'a12Exit',
              type: 'final',
            },
          },
        },
        a2: {
          initial: 'a21',
          states: {
            a21: {
              on: {
                TICK_A21: 'a22',
              },
            },
            a22: {
              exit: 'a22Exit',
              type: 'final',
            },
          },
        },
      },
    },
    b: {
      type: 'parallel',
      exit: 'bExit',
      states: {
        b1: {
          initial: 'b11',
          states: {
            b11: {
              on: {
                TICK_B11: 'b12',
              },
            },
            b12: {
              exit: 'b12Exit',
              type: 'final',
            },
          },
        },
        b2: {
          initial: 'b21',
          states: {
            b21: {
              on: {
                TICK_B21: 'b22',
              },
            },
            b22: {
              exit: 'b22Exit',
              type: 'final',
            },
          },
        },
      },
    },
    c: {
      initial: 'c1',
      exit: 'cExit',
      states: {
        c1: {
          on: {
            TICK_C1: 'c2',
          },
        },
        c2: {
          type: 'final',
        },
      },
    },
  },
});
