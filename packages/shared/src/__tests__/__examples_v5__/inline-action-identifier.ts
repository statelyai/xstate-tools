import { createMachine } from 'xstate5';

const someAction = () => {};

createMachine({
  tsTypes: {} as import('./inline-action-identifier.typegen').Typegen0,
  entry: someAction,
});
