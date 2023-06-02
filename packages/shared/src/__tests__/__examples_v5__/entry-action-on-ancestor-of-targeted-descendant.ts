import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./entry-action-on-ancestor-of-targeted-descendant.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        GO_STRING: '#c',
      },
    },
    b: {
      entry: ['sayHello'],
      initial: 'c',
      states: {
        c: {
          id: 'c',
        },
      },
    },
  },
});
