import { createMachine } from 'xstate';

export const arraysAsTargets = createMachine({
  type: 'parallel',
  on: {
    '*': [
      {
        target: ['first.a', 'second.b'],
      },
      {
        target: ['first.c', 'second.a'],
      },
    ],
  },
  states: {
    first: {
      initial: 'a',
      states: {
        a: {},
        b: {},
        c: {},
      },
    },
    second: {
      initial: 'a',
      states: {
        a: {},
        b: {},
        c: {},
      },
    },
  },
});
