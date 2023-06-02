import { createMachine } from 'xstate';

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
