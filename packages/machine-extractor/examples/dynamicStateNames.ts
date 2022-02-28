import { createMachine } from "xstate";

const START_STATE = "first";

export const machine = createMachine({
  initial: START_STATE,
  states: {
    [START_STATE]: {},
  },
});
