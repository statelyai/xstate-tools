import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./guard-double-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: 'PING' },
  },
  on: {
    PING: {
      cond: 'is this "safe"',
      actions: () => {},
    },
  },
});
