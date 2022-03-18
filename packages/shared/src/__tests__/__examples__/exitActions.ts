import { createMachine } from "xstate";

const exitActionsMachine = createMachine(
  {
    initial: "a",
    tsTypes: {} as import("./exitActions.typegen").Typegen0,
    schema: {
      events: {} as { type: "FOO"; foo: string } | { type: "BAR" },
    },
    states: {
      a: {
        exit: "doSomethingWithFoo",
        on: {
          FOO: {
            target: "b",
          },
        },
      },
      b: {},
    },
  },
  {
    actions: {
      doSomethingWithFoo: (context, event) => {
        if (event.type === "FOO") {
          console.log(event.foo);
        }
        if (event.type === "xstate.stop") {
          console.log(event.type);
        }
      },
    },
  },
);
