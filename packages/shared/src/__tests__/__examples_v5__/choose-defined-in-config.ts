import { choose, createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./choose-defined-in-config.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      on: {
        FOO: 'b',
      },
    },
    b: {
      entry: choose([
        {
          actions: ['a', 'b', 'c'],
          guard: 'cond1',
        },
      ]),
    },
  },
});
