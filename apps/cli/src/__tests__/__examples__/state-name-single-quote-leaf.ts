import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./state-name-single-quote-leaf.typegen').Typegen0,
  schema: {
    events: {} as { type: 'NEXT' },
  },
  initial: 'a',
  states: {
    a: {
      initial: "oh, this is just 'awesome'",
      states: {
        "oh, this is just 'awesome'": {},
      },
    },
  },
});
