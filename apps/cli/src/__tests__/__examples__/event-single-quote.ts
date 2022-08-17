import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./event-single-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: "let's freestyle" },
  },
  on: {
    "let's freestyle": {
      actions: 'rap like Eminem',
    },
  },
});
