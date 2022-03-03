import { groupByUniqueName, parseMachinesFromFile } from "..";

describe("Choose parsing", () => {
  it("Should be able to grab actions and guardsdeclared inside a choose action", () => {
    const result = parseMachinesFromFile(`
      createMachine({
        entry: [
          choose([
            {
              actions: ["1", "2", "3"],
              cond: "cond1",
            },
            {
              actions: ["2", "4"],
              cond: "cond2",
            },
          ])
        ]
      })
    `);

    expect(
      Object.keys(groupByUniqueName(result.machines[0].getAllConds(["named"]))),
    ).toHaveLength(2);

    expect(
      Object.keys(
        groupByUniqueName(result.machines[0].getAllActions(["named"])),
      ),
    ).toHaveLength(4);
  });
});
