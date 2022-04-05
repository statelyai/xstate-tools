import { createMachine } from "xstate";
import { choose } from "xstate/lib/actions";

const machine = createMachine(
  {
    tsTypes: {} as import("./chooseInMachineOptions.typegen").Typegen0,
    schema: {
      events: {} as { type: "FOO"; val: number } | { type: "BAR"; val: string },
    },
    initial: "a",
    states: {
      a: {
        on: {
          FOO: "b",
        },
      },
      b: {
        entry: "wow",
      },
    },
  },
  {
    guards: {
      cond1: (context, event) => {
        ((_accept: "FOO") => {})(event.type);
        return true;
      },
    },
    actions: {
      a: (context, event) => {
        ((_accept: "FOO") => {})(event.type);
      },
      b: () => {},
      c: () => {},
      wow: choose([
        {
          actions: ["a", "b", "c"],
          cond: "cond1",
        },
      ]),
    },
  }
);
