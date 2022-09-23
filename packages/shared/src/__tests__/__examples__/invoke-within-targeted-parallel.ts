import { createMachine } from 'xstate';

const machine = createMachine({
  tsTypes: {} as import('./invoke-within-targeted-parallel.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        GO_STRING: 'b',
      },
    },
    b: {
      type: 'parallel',
      states: {
        c: {
          invoke: {
            src: 'jump',
          },
        },
      },
    },
  },
});
