import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./event-backtick.typegen').Typegen0,
  schema: {
    events: {} as { type: '`tick`, `tick`' },
  },
  on: {
    '`tick`, `tick`': {
      actions: 'testAction',
    },
  },
});
