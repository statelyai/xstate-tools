import { createMachine } from "xstate";

const a = "action";
const b = 2;

createMachine(
  {
    tsTypes: {} as import("./action-as-template-literal.typegen").Typegen0,
    entry: [`action1`, `${a}${b}`],
  },
  {
    actions: {
      action1: () => {},
      action2: () => {},
    },
  }
);
