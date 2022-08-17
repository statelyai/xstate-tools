import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./delay-backtick.typegen').Typegen0,
  initial: 'a',
  states: {
    a: {
      after: {
        '`tick`, `tick`, `tick`': 'b',
      },
    },
    b: {},
  },
});
