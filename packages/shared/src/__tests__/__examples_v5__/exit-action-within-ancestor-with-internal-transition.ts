import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  tsTypes:
    {} as import('./exit-action-within-ancestor-with-internal-transition.typegen').Typegen0,
  states: {
    a: {
      on: {
        FOO: '.a2',
      },
      initial: 'a1',
      states: {
        a1: { exit: 'exitA1' },
        a2: { exit: 'exitA2' },
      },
    },
  },
});
