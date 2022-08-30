import { createMachine } from "xstate";

export const machine = createMachine(
  {
    tsTypes: {} as import("./action-groups-nested.typegen").Typegen0,
    entry: "group1",
    on: {
      event1: { actions: "group1" },
      event2: { actions: "group2" },
      event3: { actions: "group3" },
    },
  },
  {
    actions: {
      group1: ["1", "group2"],
      group2: ["2", "group3"],
      group3: ["3"],
    },
  }
);
