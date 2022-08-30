import { groupByUniqueName } from "../groupByUniqueName";
import { parseMachinesFromFile } from "../parseMachinesFromFile";

describe("action groups parsing", () => {
  it("should be able to grab actions declared in an action group in machine options", () => {
    const result = parseMachinesFromFile(`
			createMachine(
				{
					entry: 'group',
				},
				{
					actions: {
						group: ['1', '2'],
					}
				}
			)
		`);

    const named = Object.keys(
      groupByUniqueName(result.machines[0].getAllActions(["named"]))
    );

    expect(named).toHaveLength(3);
    expect(named).toEqual(["1", "2", "group"]);
  });

  it("should be able to handle groups within groups", () => {
    const result = parseMachinesFromFile(`
			createMachine(
				{
					entry: 'group1',
					on: {
						event: 'group1',
					},
				},
				{
					actions: {
						group1: ['1', 'group2'],
						group2: ['2', 'group3'],
						group3: ['3']
					}
				}
			)
		`);

    const named = Object.keys(
      groupByUniqueName(result.machines[0].getAllActions(["named"]))
    );

    expect(named).toHaveLength(6);
    expect(named).toEqual(["1", "2", "3", "group1", "group2", "group3"]);
  });
});
