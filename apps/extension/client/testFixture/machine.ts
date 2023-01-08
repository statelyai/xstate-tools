import { createMachine } from 'xstate';

/** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgAoBbAQwGMALASwzAEoA6KiAGzHxAActYqAXKlgwcAHogAsAJnQBPRAA4ArA3EBOdYtUBmAAyr5qxfPHI0IYuWq06HbrwFDRiAIzzZL+Qx3efv3wHZTUyA */
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
