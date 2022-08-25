import { createMachine } from "xstate";
import { pure } from "xstate/lib/actions";

export const machine = createMachine({
  tsTypes: {} as import("./pure-defined-in-config.typegen").Typegen0,
  entry: pure(() => ["someAction", "someOtherAction"]),
  on: {
    event: {
      actions: pure(() => ["someAction", "someOtherAction"]),
    },
  },
});
