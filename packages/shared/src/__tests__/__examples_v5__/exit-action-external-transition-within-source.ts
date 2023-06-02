import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  tsTypes:
    {} as import('./exit-action-external-transition-within-source.typegen').Typegen0,
  states: {
    a: {
      exit: 'exitA',
      initial: 'c',
      on: {
        FOO: {
          target: '.d',
          internal: false,
        },
      },
      states: {
        c: {},
        d: {},
      },
    },
  },
});
