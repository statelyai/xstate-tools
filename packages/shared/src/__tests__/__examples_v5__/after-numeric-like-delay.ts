import { createMachine } from 'xstate5';

createMachine({
  tsTypes: {} as import('./after-numeric-like-delay.typegen').Typegen0,
  after: {
    500: {
      actions: 'sayHello',
    },
  },
});
