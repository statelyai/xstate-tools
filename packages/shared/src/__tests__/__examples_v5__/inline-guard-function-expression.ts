import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./inline-guard-function-expression.typegen').Typegen0,
  on: {
    FOO: {
      cond: () => false,
      actions: 'logSmth',
    },
  },
});
