import { groupByUniqueName } from "../groupByUniqueName";
import { parseMachinesFromFile } from "../parseMachinesFromFile";

describe("pure parsing", () => {
  it("should be able to grab actions declared inside a pure action", () => {
    const result = parseMachinesFromFile(`
			createMachine({
				entry: [
					pure((context, event) => ["1"])
				],
        on: {
          event: {
            actions: pure((context, event) => ["2"])
          }
        }
			})
		`);

    const named = Object.keys(
      groupByUniqueName(result.machines[0].getAllActions(["named"]))
    );

    expect(named).toHaveLength(2);
    expect(named).toEqual(["1", "2"]);
  });
});

describe("pure in machine options", () => {
  it("should be able to grab actions declared in a pure in machine options", () => {
    const result = parseMachinesFromFile(`
			createMachine({
				entry: 'doStuff',
			}, {
				actions: {
					doStuff: pure((context, event) => ["1", "2"])
				}
			})
		`);

    const named = Object.keys(
      groupByUniqueName(result.machines[0].getAllActions(["named"]))
    );

    expect(named).toHaveLength(3);
    expect(named).toEqual(["1", "2", "doStuff"]);
  });
});
