import { createMachine } from "xstate";

const machine = createMachine(
  {
    tsTypes: {} as import("./recursive-invoke.typegen").Typegen0,
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
        initial: "c",
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

        return {} as never;
      },
    },
  }
);
