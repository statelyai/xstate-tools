import { createMachine } from "xstate";

export const tagMachine = createMachine({
  tags: ["a"],
  states: {
    foo: {
      tags: "a",
    },
    bar: {
      tags: ["b", "c"],
    },
  },
});
