import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./service-single-quote.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      invoke: {
        id: "just tell me how I'm feeling",
        src: "just tell me how I'm feeling",
        onDone: 'finished',
        onError: 'failed',
      },
    },
    finished: {},
    failed: {},
  },
});
