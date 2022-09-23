import { createMachine } from 'xstate';

createMachine(
  {
    tsTypes: {} as import('./guard-provided-function.typegen').Typegen0,
    on: {
      FOO: {
        cond: 'guard',
        actions: 'sayHello',
      },
    },
  },
  {
    guards: {
      guard: () => true,
    },
  },
);
