import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./action-backtick.typegen').Typegen0,
  schema: {
    events: {} as { type: 'PING' },
  },
  on: {
    PING: {
      actions: 'log `event`',
    },
  },
});
