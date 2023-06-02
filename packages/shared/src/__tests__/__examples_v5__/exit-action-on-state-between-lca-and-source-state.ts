import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./exit-action-on-state-between-lca-and-source-state.typegen').Typegen0,
  initial: 'a',
  exit: ['rootExit'],
  states: {
    a: {
      exit: ['sayHello'],
      initial: 'a1',
      states: {
        a1: {
          on: {
            FOO: '#b',
          },
        },
      },
    },
    b: {
      id: 'b',
    },
  },
});
