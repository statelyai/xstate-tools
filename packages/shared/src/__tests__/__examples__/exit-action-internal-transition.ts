import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  tsTypes: {} as import('./exit-action-internal-transition.typegen').Typegen0,
  states: {
    a: {
      exit: 'exitA',
      initial: 'c',
      on: {
        FOO: {
          target: '.d',
        },
      },
      states: {
        c: {},
        d: {},
      },
    },
  },
});
