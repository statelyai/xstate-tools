import { createMachine } from 'xstate5';

createMachine({
  tsTypes:
    {} as import('./entry-action-root-transition-targeting-descendant-using-id.typegen').Typegen0,
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
