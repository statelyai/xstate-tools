import { createMachine } from 'xstate';

export const machine = createMachine({
  meta: {
    description: 'description',
    someOtherField: 'hello there',
  },
});
