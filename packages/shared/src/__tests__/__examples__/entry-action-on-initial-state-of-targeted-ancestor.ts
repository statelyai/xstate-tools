import { createMachine } from "xstate";

const machine = createMachine({
  tsTypes:
    {} as import("./entry-action-on-initial-state-of-targeted-ancestor.typegen").Typegen0,
  initial: "a",
  states: {
    a: {
      on: {
        GO_STRING: "b",
      },
    },
    b: {
      initial: "c",
      states: {
        c: {
          entry: ["sayHello"],
        },
      },
    },
  },
});
