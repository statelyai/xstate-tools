import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./guard-single-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: 'PING' },
  },
  on: {
    PING: {
      cond: "it's play time",
      actions: () => {},
    },
  },
});
