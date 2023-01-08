import { createMachine } from 'xstate';

createMachine(
  {
    id: '(machine)',
    initial: 'idle',
    states: {
      idle: {
        on: {
          NEXT: {
            target: 'active',
            cond: 'canGoNext',
          },
        },
      },
      active: {},
    },
  },
  {
    guards: {
      canGoNext: () => false,
    },
  },
);
