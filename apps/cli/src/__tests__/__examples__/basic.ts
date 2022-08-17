import { createMachine } from 'xstate';

createMachine(
  {
    tsTypes: {} as import('./basic.typegen').Typegen0,
    schema: {
      events: {} as
        | {
            type: 'FOO';
          }
        | {
            type: 'BAR';
          },
    },
    initial: 'a',
    states: {
      a: {
        on: {
          FOO: 'b',
          BAR: 'c',
        },
      },
      b: {
        entry: ['someAction'],
      },
      c: {
        entry: ['otherAction'],
      },
    },
  },
  {
    actions: {
      someAction: (context, event) => {
        ((accept: 'FOO') => {})(event.type);
      },
      otherAction: (context, event) => {
        ((accept: 'BAR') => {})(event.type);
      },
    },
  },
);
