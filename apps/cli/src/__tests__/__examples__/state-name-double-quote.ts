import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./state-name-double-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: 'NEXT' },
  },
  initial: 'oh, this is just "awesome"',
  states: {
    'oh, this is just "awesome"': {},
  },
});
