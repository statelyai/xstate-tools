import { createMachine } from 'xstate5';

createMachine(
  {
    tsTypes: {} as import('./action-provided-function.typegen').Typegen0,
    entry: 'someAction',
  },
  {
    actions: {
      someAction() {},
    },
  },
);
