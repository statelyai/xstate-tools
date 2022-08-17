import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./state-name-double-quote-compound.typegen').Typegen0,
  schema: {
    events: {} as { type: 'NEXT' },
  },
  initial: 'oh, this is just "awesome"',
  states: {
    'oh, this is just "awesome"': {
      initial: 'a',
      states: {
        a: {},
      },
    },
  },
});
