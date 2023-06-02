import { createMachine } from 'xstate';

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
