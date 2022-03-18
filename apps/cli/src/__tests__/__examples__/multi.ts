import { createMachine } from "xstate";

const machine1 = createMachine({
  tsTypes: {} as import("./multi.typegen").Typegen0,
  initial: "a",
  states: {
    a: {},
  },
});

const machine2 = createMachine({
  tsTypes: {} as import("./multi.typegen").Typegen1,
  initial: "a",
  states: {
    a: {},
  },
});
