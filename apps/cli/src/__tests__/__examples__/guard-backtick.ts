import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./guard-backtick.typegen').Typegen0,
  schema: {
    events: {} as { type: 'PING' },
  },
  on: {
    PING: {
      cond: 'is `event` valid',
      actions: () => {},
    },
  },
});
