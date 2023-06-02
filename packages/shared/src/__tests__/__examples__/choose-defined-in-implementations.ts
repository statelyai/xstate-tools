import { createMachine } from 'xstate';
import { choose } from 'xstate/lib/actions';

createMachine(
  {
    tsTypes:
      {} as import('./choose-defined-in-implementations.typegen').Typegen0,
    initial: 'a',
    states: {
      a: {
        on: {
          FOO: 'b',
        },
      },
      b: {
        entry: 'wow',
      },
    },
  },
  {
    guards: {
      cond1: () => true,
    },
    actions: {
      a: () => {},
      b: () => {},
      c: () => {},
      wow: choose([
        {
          actions: ['a', 'b', 'c'],
          cond: 'cond1',
        },
      ]),
    },
  },
);
