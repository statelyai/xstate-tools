import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./entry-actions-basic.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        FOO: 'b',
        BAR: 'c',
      },
    },
    b: {
      entry: ['someAction'],
    },
    c: {
      entry: ['otherAction'],
    },
  },
});
