import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  tsTypes:
    {} as import('./exit-action-on-ancestor-with-external-transition-on-descendant.typegen').Typegen0,
  states: {
    a: {
      exit: 'doSomethingWithFoo',
      initial: 'a1',
      states: {
        a1: {
          on: {
            FOO: {
              target: '#b',
            },
          },
        },
      },
    },
    b: {
      id: 'b',
    },
  },
});
