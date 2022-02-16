import { parseMachinesFromFile } from "xstate-parser-demo";
import { getNewMachineText, ImplementationsMetadata } from "..";
import { MachineConfig } from "xstate";

const defaultImplementations = {
  implementations: {
    actions: {},
    guards: {},
    services: {},
  },
};

const runTest = (
  input: string,
  newConfig: MachineConfig<any, any, any>,
  implementations: ImplementationsMetadata = defaultImplementations,
) => {
  return getNewMachineText({
    fileName: __filename,
    implementations,
    machine: parseMachinesFromFile(input).machines[0],
    text: input,
    newConfig,
  }).then((res) => res.replace(/  /g, "\t"));
};

describe("getNewMachineText", () => {
  it("Should preserve context, tsTypes, meta, data, delimiter and preserveActionOrder keys", async () => {
    const INPUT = `
			createMachine({
				context: {
					wow: () => {},
				},
				tsTypes: {},
				meta: {
					cool: true
				},
				data: () => {},
				delimiter: "/",
				preserveActionOrder: true,
			})
		`;

    const newText = await runTest(INPUT, {
      id: "wow",
    });

    expect(newText).toEqual(
      `{
	context: { wow: () => {} },
	tsTypes: {},
	meta: { cool: true },
	data: () => {},
	delimiter: "/",
	preserveActionOrder: true,
	id: "wow",
}`,
    );
  });

  it("Should preserve type annotations on protected keys", async () => {
    const INPUT = `
			createMachine({
				schema: {} as {}
			})
		`;

    const newText = await runTest(INPUT, {
      id: "wow",
    });

    expect(newText).toEqual(
      `{
	schema: {} as {},
	id: "wow",
}`,
    );
  });

  describe("Inline implementations", () => {
    it("Should preserve inline implementations on actions, guards and services", async () => {
      const INPUT = `
					createMachine({
						entry: ['action'],
						invoke: {
							src: 'invoke',
						},
						on: {
							WOW: {
								cond: 'cond'
							}
						},
					})
				`;

      const newText = await runTest(
        INPUT,
        {
          entry: ["action"],
          invoke: {
            src: "invoke",
          },
          on: {
            WOW: {
              cond: "cond",
            },
          },
        },
        {
          implementations: {
            actions: {
              action: {
                jsImplementation: "() => {}",
              },
            },
            guards: {
              cond: {
                jsImplementation: "() => {}",
              },
            },
            services: {
              invoke: {
                jsImplementation: "() => {}",
              },
            },
          },
        },
      );

      // NOTE - use spaces, not tabs, otherwise Jest will
      // think the indentation is wrong
      expect(newText).toEqual(
        `{
	entry: [() => {}],
	invoke: {
		src: () => {},
	},
	on: {
		WOW: {
			cond: () => {},
		},
	},
}`,
      );
    });

    it("Should preserve comments and double-quotes inside inline implementations", async () => {
      const INPUT = `
					createMachine({
						entry: ['action'],
					})
				`;

      const newText = await runTest(
        INPUT,
        {
          entry: ["action"],
        },
        {
          implementations: {
            actions: {
              action: {
                jsImplementation: `
									() => {
										// Amazing stuff "wow", cool
									}
								`,
              },
            },
            guards: {},
            services: {},
          },
        },
      );

      // NOTE - use spaces, not tabs, otherwise Jest will
      // think the indentation is wrong
      expect(newText).toEqual(
        `{
	entry: [
		() => {
			// Amazing stuff "wow", cool
		},
	],
}`,
      );
    });

    it.todo("Should preserve type annotations on inline implementations");
  });

  it.skip("REPL", async () => {
    const INPUT = `
			createMachine({
				id: "test",
			})
		`;

    const newText = await runTest(INPUT, {
      id: "wow",
      states: {
        a: {
          on: {
            WOW: "b",
          },
        },
        b: {},
      },
    });

    expect(newText).toEqual(
      `{
	id: "wow",
	states: {
		a: {},
		b: {},
	},
}`,
    );
  });
});
