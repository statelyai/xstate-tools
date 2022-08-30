import { createMachine } from "xstate";

export const machine = createMachine(
  {
    tsTypes: {} as import("./action-groups.typegen").Typegen0,
    entry: "group",
    on: {
      event: { actions: "group" },
    },
  },
  {
    actions: {
      group: ["action1", "action2"],
    },
  }
);
