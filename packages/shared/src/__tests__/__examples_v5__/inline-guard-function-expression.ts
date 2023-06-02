import { createMachine } from 'xstate5';

createMachine({
  tsTypes: {} as import('./inline-guard-function-expression.typegen').Typegen0,
  on: {
    FOO: {
      cond: () => false,
      actions: 'logSmth',
    },
  },
});
