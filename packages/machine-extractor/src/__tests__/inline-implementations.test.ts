import { extractMachinesFromFile } from '../extractMachinesFromFile';

// Skip until inline guards are extracted in the shape of {kind: 'inline', guard: {}}
describe.skip('Inline implementations', () => {
  it('Should pick up guards declared inline deeper than the root level', () => {
    const input = `
			createMachine({
				states: {
					a: {
						always: {
							cond: () => true,
						}
					},
				}
			})
		`;

    const result = extractMachinesFromFile(input)!;

    const machine = result!.machines[0]!;

    const config = machine.toConfig();

    const parsedId = (config as any)?.states.a.always.cond;

    expect(parsedId).toBeTruthy();
    expect(typeof parsedId).toEqual('string');
  });
});
