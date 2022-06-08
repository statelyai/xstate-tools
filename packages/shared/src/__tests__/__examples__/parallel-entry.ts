import { createMachine } from "xstate";

const machine = createMachine(
  {
    tsTypes: {} as import("./parallel-entry.typegen").Typegen0,
    initial: "a",
    schema: {
      events: {} as { type: "GO_STRING"; answer: string },
    },
    states: {
      a: {
        on: {
          GO_STRING: "b",
        },
      },
      b: {
        type: "parallel",
        states: {
          c: {
            entry: "sayHello",
          },
        },
      },
    },
  },
  {
    actions: {
      sayHello: (context, event) => {
        ((_accept: string) => {})(event.answer);
      },
    },
  }
);
