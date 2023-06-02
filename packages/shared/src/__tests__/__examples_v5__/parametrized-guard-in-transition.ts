import { createMachine } from 'xstate5';

createMachine({
  tsTypes: {} as import('./parametrized-guard-in-transition.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        MY_AWESOME_EVENT: {
          target: 'b',
          guard: {
            type: 'myAwesomeGuard',
          },
        },
      },
    },
    b: {},
  },
});
