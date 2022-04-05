import { createMachine } from "xstate";

const machine = createMachine(
  {
    tsTypes: {} as import("./parallel-invoke.typegen").Typegen0,
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
            invoke: {
              src: "jump",
            },
          },
        },
      },
    },
  },
  {
    services: {
      jump: async (context, event) => {
        ((_accept: string) => {})(event.answer);
      },
    },
  }
);
