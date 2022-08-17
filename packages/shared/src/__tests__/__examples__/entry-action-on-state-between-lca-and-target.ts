import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./entry-action-on-state-between-lca-and-target.typegen').Typegen0,
  entry: ['rootEntry'],
  initial: 'a',
  states: {
    a: {
      on: {
        FOO: '#b1',
      },
    },
    b: {
      entry: ['sayHello'],
      initial: 'b1',
      states: {
        b1: {
          id: 'b1',
        },
      },
    },
  },
});
