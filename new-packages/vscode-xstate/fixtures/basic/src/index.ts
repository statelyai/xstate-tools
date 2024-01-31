import { createMachine } from 'xstate';

createMachine({
  initial: 'a',
  states: {
    a: {
      on: {
        NEXT: 'b',
        kappa: 'c',
      },
    },
    b: {},
    c: {},
  },
});
