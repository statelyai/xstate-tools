import { extractMachinesFromFile } from '..';

describe('Layout comments', () => {
  it('Should ensure that layout comments are parsed', () => {
    const result = extractMachinesFromFile(`
      /** @xstate-layout layout-string */
      const machine = createMachine({});
    `);

    expect(result!.machines[0]!.getLayoutComment()?.value).toEqual(
      `layout-string`,
    );
  });

  it('Should parse layout comments that appear after the variable declaration', () => {
    const result = extractMachinesFromFile(`
      const machine =
      /** @xstate-layout layout-string */
      createMachine({});
    `);

    expect(result!.machines[0]!.getLayoutComment()?.value).toEqual(
      `layout-string`,
    );
  });

  it('Should parse layout comments that are near variable declaration', () => {
    const result = extractMachinesFromFile(`
      const machine =
      /** @xstate-layout layout-string */
      
      createMachine({});
    `);

    expect(result!.machines[0]!.getLayoutComment()?.value).toEqual(
      `layout-string`,
    );
  });

  it('Should not parse layout comments that are far from machine', () => {
    const result = extractMachinesFromFile(`
      /** @xstate-layout layout-string */
      




      const machine = createMachine({});
    `);

    expect(result!.machines[0]!.getLayoutComment()?.value).toBeUndefined();
  });
});
