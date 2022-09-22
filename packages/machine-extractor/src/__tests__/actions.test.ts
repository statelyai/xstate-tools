import { parseMachinesFromFile } from "../parseMachinesFromFile";

describe("actions parsing", () => {
  it("Should be able to grab string or template literal actions", () => {
    const result = parseMachinesFromFile(`
			const a = "action"
			const b = 3

      createMachine({
				entry: ["action1", \`action2\`, \`\${a}\${b}\`]
      })
    `);

    expect(
      Object.keys(result.machines[0].getAllActions(["named"]))
    ).toHaveLength(3);
  });
});
