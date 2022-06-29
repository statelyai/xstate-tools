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

const exitAction2Machine = createMachine(
  {
    initial: "a",
    tsTypes: {} as import("./exitActions.typegen").Typegen1,
    schema: {
      events: {} as { type: "FOO"; foo: string } | { type: "BAR" },
    },
    states: {
      a: {
        exit: "exitA",
        initial: "c",
        on: {
          FOO: {
            target: ".d",
          },
        },
        states: {
          c: {},
          d: {},
        },
      },
    },
  },
  {
    actions: {
      exitA: (context, event) => {
        ((_expect: "xstate.stop") => {})(event.type);
      },
    },
  },
);

createMachine(
  {
    tsTypes: {} as import("./exitActions.typegen").Typegen2,
    schema: {
      events: {} as { type: "FOO"; foo: string } | { type: "BAR" },
    },
    states: {
      a: {
        on: {
          FOO: "c",
        },
        states: {
          b: {
            exit: "myAction", // this should receive FOO | 'xstate.stop'
          },
        },
      },
      c: {},
    },
  },
  {
    actions: {
      myAction: (context, event) => {
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
