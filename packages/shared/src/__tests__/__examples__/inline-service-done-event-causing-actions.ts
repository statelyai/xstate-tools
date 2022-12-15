import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./inline-service-done-event-causing-actions.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      invoke: {
        src: () => Promise.resolve(),
        onDone: {
          target: 'b',
          actions: 'invokeOnDoneAction',
        },
      },
    },
    b: {
      entry: 'entryB',
    },
  },
});
