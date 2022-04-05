import { createMachine } from "xstate";

const machine = createMachine(
  {
    tsTypes: {} as import("./parallel.typegen").Typegen0,
    initial: "a",
    schema: {
      events: {} as
        | { type: "GO_STRING"; answer: string }
        | { type: "GO_NUMBER"; count: number },
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
