import { createMachine } from "xstate";

createMachine({
  tsTypes: {} as import("./event-causing-delay.typegen").Typegen0,
  schema: {
    events: {} as {
      type: "NEXT";
    },
  },
  initial: "a",
  states: {
    a: {
      on: {
        NEXT: "b",
      },
    },
    b: {
      after: {
        myDelay: "c",
      },
    },
    c: {},
  },
}, {
	delays: {
		myDelay: (ctx, ev) => {
			((_accept: 'NEXT') => {})(ev.type)
			return 10
		}
	}
});
