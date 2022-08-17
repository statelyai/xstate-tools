import { createMachine } from 'xstate';

const states = {
  first: 'FIRST',
  second: 'SECOND',
  third: {
    fourth: 'FOURTH',
    deep: {
      wow: 'wow',
    },
  },
};

export const dynamic = createMachine({
  initial: states.first,
  states: {
    [states.first]: {
      on: {},
    },
    [states.third.deep.wow]: {
      states: {},
    },
  },
});
