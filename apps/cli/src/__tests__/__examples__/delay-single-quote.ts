import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./delay-single-quote.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      after: {
        "just '2 minutes'": 'b',
      },
    },
    b: {},
  },
});
