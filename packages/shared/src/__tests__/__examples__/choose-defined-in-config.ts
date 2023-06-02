import { createMachine } from 'xstate';
import { choose } from 'xstate/lib/actions';

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
          cond: 'cond1',
        },
      ]),
    },
  },
});
