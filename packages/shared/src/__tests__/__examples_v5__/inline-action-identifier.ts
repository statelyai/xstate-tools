import { createMachine } from 'xstate';

const someAction = () => {};

createMachine({
  tsTypes: {} as import('./inline-action-identifier.typegen').Typegen0,
  entry: someAction,
});
