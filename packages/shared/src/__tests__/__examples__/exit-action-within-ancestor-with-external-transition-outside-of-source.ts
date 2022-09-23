import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./exit-action-within-ancestor-with-external-transition-outside-of-source.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      initial: 'b',
      on: {
        FOO: 'c',
      },
      states: {
        b: {
          exit: 'myAction',
        },
      },
    },
    c: {},
  },
});
