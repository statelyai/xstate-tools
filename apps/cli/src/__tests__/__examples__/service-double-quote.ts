import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./service-double-quote.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      invoke: {
        id: 'trigger "fake" alarm',
        src: 'trigger "fake" alarm',
        onDone: 'finished',
        onError: 'failed',
      },
    },
    finished: {},
    failed: {},
  },
});
