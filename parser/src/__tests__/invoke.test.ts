import { parseMachinesFromFile } from "../parseMachinesFromFile";

describe("Invoke", () => {
  it("Should allow for JSON stringifying anonymous invocations", () => {
    const result = parseMachinesFromFile(`
      createMachine({
        invoke: {
          src: () => {},
        }
      })
    `);

    const config = JSON.stringify(result.machines[0].toConfig());

    /**
     * The function should be parsed as
     * anonymous
     */
    expect(config).toContain("8ts6su");
  });

  it("Should detect inline implementations correctly", () => {
    const result = parseMachinesFromFile(`
      createMachine({
        invoke: {
          src: () => {},
        }
      })
    `);

    const invoke = result.machines[0].ast.definition?.invoke?.[0];

    expect(invoke?.src?.declarationType).toEqual("inline");

    const invokes = result.machines[0].getAllServices(["inline"]);

    expect(invokes).toHaveLength(1);
  });
});
