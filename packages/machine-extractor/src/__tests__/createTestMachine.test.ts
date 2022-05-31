import { parseMachinesFromFile } from "../parseMachinesFromFile";

it("Should handle createTestMachine", () => {
  const machines = parseMachinesFromFile(`
  	createTestMachine({});
  `);

  const result = machines.machines[0];

  expect(result).toBeTruthy();
});
