import { createMachine } from 'xstate';

// this behavior might change in v5 if we decide that root is not never exited when transitions are taken

createMachine({
  tsTypes:
    {} as import('./entry-action-root-external-transition.typegen').Typegen0,
  entry: ['rootEntry'],
  on: {
    FOO: '#b',
  },
  initial: 'a',
  states: {
    a: {},
    b: {
      id: 'b',
    },
  },
});
