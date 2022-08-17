import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./action-double-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: 'PING' },
  },
  on: {
    PING: {
      actions: 'show me your "tricks"',
    },
  },
});
