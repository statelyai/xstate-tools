import { createMachine, fromPromise } from 'xstate5';

createMachine({
  tsTypes:
    {} as import('./inline-service-done-event-causing-actions.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      invoke: {
        src: fromPromise(() => Promise.resolve()),
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
