import { createMachine } from 'xstate5';

const someGuard = () => false;

createMachine({
  tsTypes: {} as import('./inline-guard-identifier.typegen').Typegen0,
  on: {
    FOO: {
      cond: someGuard,
      actions: 'logSmth',
    },
  },
});
