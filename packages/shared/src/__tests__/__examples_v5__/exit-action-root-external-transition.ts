import { createMachine } from 'xstate';

// this behavior might change in v5 if we decide that root is not never exited when transitions are taken

createMachine({
  tsTypes:
    {} as import('./exit-action-root-external-transition.typegen').Typegen0,
  exit: ['rootExit'],
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
