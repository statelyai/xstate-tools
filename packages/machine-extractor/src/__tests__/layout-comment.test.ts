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
});
