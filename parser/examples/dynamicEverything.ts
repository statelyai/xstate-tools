import { createMachine } from "xstate";

const START_STATE = "first";
const OTHER_STATE = "second";
const COOL = "cool";

const otherStates = {
  [START_STATE]: {},
  awesome: {},
  "nice stuff": {},
};

const states = {
  ...otherStates,
  [START_STATE]: {},
  ["cool"]: {},
  [OTHER_STATE]: {
    on: {
      [COOL]: {
        target: START_STATE,
      },
    },
  },
};

export const machine = createMachine({
  states,
});
