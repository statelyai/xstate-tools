import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./delay-double-quote.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      after: {
        'wait "forever"': 'b',
      },
    },
    b: {},
  },
});
