import { parseMachinesFromFile } from "..";

describe("After parsing", () => {
  it("Should be able to grab actions and guards declared inside a delay", () => {
    const result = parseMachinesFromFile(`
      createMachine({
        after: {
          300: [{
            actions: ['1', '2']
          }]
        }
      })
    `);

    expect(
      Object.keys(result.machines[0].getAllActions(["named"])),
    ).toHaveLength(2);
  });
});
