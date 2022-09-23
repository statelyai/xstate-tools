import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./after.typegen').Typegen0,
  after: {
    500: {
      actions: 'sayHello',
    },
  },
}).withConfig({
  // xstate.cancel and xstate.send should not be here
  actions: {
    sayHello: () => {},
  },
});
