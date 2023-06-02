import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./after-string-delay.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        NEXT: 'b',
      },
    },
    b: {
      after: {
        myDelay: 'c',
      },
    },
    c: {
      entry: ['someAction'],
    },
  },
});
