import { createMachine } from 'xstate5';

createMachine({
  tsTypes:
    {} as import('./entry-action-root-reentering-transition.typegen').Typegen0,
  entry: ['rootEntry'],
  on: {
    FOO: {
      target: '#b',
      reenter: true,
    },
  },
  initial: 'a',
  states: {
    a: {},
    b: {
      id: 'b',
    },
  },
});
