import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  tsTypes:
    {} as import('./exit-action-external-transition-out-of-source.typegen').Typegen0,
  states: {
    a: {
      exit: 'doSomethingWithFoo',
      on: {
        FOO: {
          target: 'b',
        },
      },
    },
    b: {},
  },
});
