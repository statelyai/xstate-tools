import { createMachine } from 'xstate';

createMachine(
  {
    tsTypes: {} as import('./action-missing.typegen').Typegen0,
    entry: [
      'someAction',
      'otherAction',
      'notImplementedYet',
      'anotherNotImplementedYet',
    ],
  },
  {
    actions: {
      someAction: () => {},
      otherAction: () => {},
    },
  },
);
