import { hashedId, parseMachinesFromFile } from '@xstate/machine-extractor';
import { MachineConfig } from 'xstate';
import { getNewMachineText, ImplementationsMetadata } from '..';

const defaultImplementations = {
  actions: {},
  guards: {},
  services: {},
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
    // To allow us to use tabs in the example output
  }).then((res) => res.replace(/  /g, '\t'));
};

describe('getNewMachineText', () => {
  it('Should preserve context, tsTypes, meta, data, delimiter, preserveActionOrder and predictableActionArguments keys', async () => {
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
				delimiter: '/',
				preserveActionOrder: true,
				predictableActionArguments: true,
			})
		`;

    const newText = await runTest(INPUT, {
      id: 'wow',
    });

    expect(newText).toEqual(
      `{
	context: { wow: () => {} },
	tsTypes: {},
	meta: { cool: true },
	data: () => {},
	delimiter: '/',
	preserveActionOrder: true,
	predictableActionArguments: true,
	id: 'wow',
}`,
    );
  });

  it('Should preserve type annotations on protected keys', async () => {
    const INPUT = `
			createMachine({
				schema: {} as {}
			})
		`;

    const newText = await runTest(INPUT, {
      id: 'wow',
    });

    expect(newText).toEqual(
      `{
	schema: {} as {},
	id: 'wow',
}`,
    );
  });

  it('Should preserve the order of top-level keys', async () => {
    const INPUT = `
			createMachine({
				id: 'test',
				on: {},
				states: {},
			})
		`;

    const newText = await runTest(INPUT, {
      id: 'wow',
      states: {},
      on: {},
    });

    expect(newText).toEqual(
      `{
	id: 'wow',
	on: {},
	states: {},
}`,
    );
  });

  describe('Inline implementations', () => {
    it('Should preserve inline implementations on actions, guards and services', async () => {
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
          entry: ['action'],
          invoke: {
            src: 'invoke',
          },
          on: {
            WOW: {
              cond: 'cond',
            },
          },
        },
        {
          actions: {
            action: {
              jsImplementation: '() => {}',
            },
          },
          guards: {
            cond: {
              jsImplementation: '() => {}',
            },
          },
          services: {
            invoke: {
              jsImplementation: '() => {}',
            },
          },
        },
      );

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

    it('Should preserve comments and double-quotes inside inline implementations', async () => {
      const INPUT = `
					createMachine({
						entry: ['action'],
					})
				`;

      const newText = await runTest(
        INPUT,
        {
          entry: ['action'],
        },
        {
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
      );

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

    it('Should ignore whitespace differences between inline implementations when hashing them', async () => {
      const idWithWhitespace = hashedId(`
			() => {


			}   			`);

      const idWithoutWhitespace = hashedId(`() => {}`);

      const INPUT = `
				createMachine({
					entry: ['${idWithWhitespace}'],
				})
			`;

      const newText = await runTest(
        INPUT,
        {
          entry: [idWithWhitespace],
        },
        {
          actions: {
            [idWithoutWhitespace]: {
              jsImplementation: `() => {}`,
            },
          },
          services: {},
          guards: {},
        },
      );

      expect(newText).toEqual(
        `{
	entry: [() => {}],
}`,
      );
    });

    it.todo('Should preserve type annotations on inline implementations');
  });

  it('Should preserve descriptions on nodes', async () => {
    const INPUT = `
			createMachine({
				description: 'Hello',
			})
		`;

    const newText = await runTest(INPUT, {
      description: 'Hello, world!',
    });

    expect(newText).toEqual(
      `{
	description: 'Hello, world!',
}`,
    );
  });

  it.skip('REPL', async () => {
    const INPUT = `
			createMachine({
				id: "test",
			})
		`;

    const newText = await runTest(INPUT, {
      id: 'wow',
      states: {
        a: {
          on: {
            WOW: 'b',
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
