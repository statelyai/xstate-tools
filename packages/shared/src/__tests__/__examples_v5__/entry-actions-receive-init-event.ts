import { createMachine } from 'xstate5';

createMachine({
  tsTypes: {} as import('./entry-actions-receive-init-event.typegen').Typegen0,
  entry: ['rootEntry'],
  // intentionally add an extra event that can cause all of those entry actions
  // it ensures that `xstate.init` is not used merely as fallback event
  on: {
    FOO: {
      target: '#a1',
      reenter: true,
    },
  },
  initial: 'a',
  states: {
    a: {
      entry: ['entryA'],
      initial: 'a1',
      states: {
        a1: { id: 'a1', entry: ['entryA1'] },
      },
    },
  },
});
