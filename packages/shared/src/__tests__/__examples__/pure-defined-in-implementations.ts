import { createMachine } from "xstate";
import { pure } from "xstate/lib/actions";

export const machine = createMachine(
  {
    tsTypes: {} as import("./pure-defined-in-implementations.typegen").Typegen0,
    entry: "pure",
    on: {
      event: {
        actions: "pure",
      },
    },
  },
  {
    actions: {
      pure: pure((context, event) => ["someAction", "someOtherAction"]),
    },
  }
);
