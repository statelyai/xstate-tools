import { createMachine } from 'xstate';

const machine1 = createMachine(
  {
    tsTypes: {} as import('./multi.typegen').Typegen0,
    schema: {
      events: {} as { type: 'FOO' } | { type: 'BAR' },
    },
    initial: 'a',
    states: {
      a: {
        on: {
          FOO: 'b',
        },
      },
      b: {
        entry: ['entryB'],
      },
    },
  },
  {
    actions: {
      entryB: (context, event) => {
        ((_accept: 'FOO') => {})(event.type);
      },
    },
  },
);

const machine2 = createMachine(
  {
    tsTypes: {} as import('./multi.typegen').Typegen1,
    schema: {
      events: {} as { type: 'BAZ' } | { type: 'BAZ2' },
    },
    initial: 'a',
    states: {
      a: {
        on: {
          BAZ: 'b',
        },
      },
      b: {
        entry: ['entryB'],
      },
    },
  },
  {
    actions: {
      entryB: (context, event) => {
        ((_accept: 'BAZ') => {})(event.type);
      },
    },
  },
);
