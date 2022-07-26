import { createMachine } from "xstate";

createMachine(
  {
    initial: "a",
    tsTypes: {} as import("./exitActionWithTransitionOnDescendant.typegen").Typegen0,
    schema: {
      events: {} as { type: "FOO"; foo: string } | { type: "BAR" },
    },
    states: {
      a: {
        exit: "doSomethingWithFoo",
        initial: "a1",
        states: {
          a1: {
            on: {
              FOO: {
                target: "#b",
              },
            },
          },
        },
      },
      b: {
        id: "b",
      },
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
  }
);
