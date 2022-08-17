import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./after-action.typegen').Typegen0,
  after: {
    500: {
      actions: 'sayHello',
    },
  },
});
