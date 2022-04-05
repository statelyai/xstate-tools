import { createMachine } from "xstate";

const machine = createMachine(
  {
    tsTypes: {} as import("./parallel.typegen").Typegen0,
    schema: {
      context: {} as { value: string },
      events: {} as
        | { type: "GO_STRING"; answer: string }
        | { type: "GO_NUMBER"; count: number },
      services: {} as {
        jump: {
          data: boolean;
        };
        off: {
          data: boolean;
        };
      },
    },
    id: "test",
    initial: "idle",
    states: {
      idle: {
        on: {
          GO_STRING: {
            target: "doesnt",
          },
          GO_NUMBER: {
            target: "works",
          },
        },
      },
      works: {
        invoke: {
          src: "off",
          id: "off",
        },
      },
      doesnt: {
        type: "parallel",
        states: {
          a: {
            invoke: {
              src: "off",
              id: "off",
            },
          },
          b: {
            invoke: {
              src: "jump",
              id: "jump",
            },
          },
        },
      },
    },
  },
  {
    services: {
      jump: async (context, event) => {
        console.log(event.type);
        if (event.type === "GO_STRING") console.log(event.answer);
        return true;
      },
      off: async (context, event) => {
        console.log(event.type);
        return true;
      },
    },
  }
);
