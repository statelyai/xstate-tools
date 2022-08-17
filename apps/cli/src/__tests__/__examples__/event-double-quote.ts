import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./event-double-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: '"quote" it' },
  },
  on: {
    '"quote" it': {
      actions: 'wrap with quotes',
    },
  },
});
