import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./service-backtick.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      invoke: {
        id: 'prepare `ticker`',
        src: 'prepare `ticker`',
        onDone: 'finished',
        onError: 'failed',
      },
    },
    finished: {},
    failed: {},
  },
});
