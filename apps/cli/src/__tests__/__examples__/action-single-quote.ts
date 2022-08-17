import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./action-single-quote.typegen').Typegen0,
  schema: {
    events: {} as { type: 'PING' },
  },
  on: {
    PING: {
      actions: "say 'We surely shall see the sun shine soon'",
    },
  },
});
