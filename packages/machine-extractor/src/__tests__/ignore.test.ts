import { parseMachinesFromFile } from '..';

describe('xstate-ignore blocks', () => {
  it('Should pick up the comment blocks with ignore in them', () => {
    const result = parseMachinesFromFile(`
      // xstate-ignore-next-line
      createMachine({})
    `);

    expect(result.comments).toHaveLength(1);
    expect(result.machines[0].getIsIgnored()).toEqual(true);
  });

  it('Should pick up multi-line comment blocks with ignore in them', () => {
    const result = parseMachinesFromFile(`
      /** xstate-ignore-next-line */
      createMachine({})
    `);

    expect(result.comments).toHaveLength(1);
    expect(result.machines[0].getIsIgnored()).toEqual(true);
  });

  it('Should ignore misspelled comments', () => {
    const result = parseMachinesFromFile(`
      /** xstate-ignore-next-sline */
      createMachine({})
    `);

    expect(result.comments).toHaveLength(0);
    expect(result.machines[0].getIsIgnored()).toEqual(false);
  });

  it('Should ignore comments that are above the line', () => {
    const result = parseMachinesFromFile(`
      /** xstate-ignore-next-line */

      createMachine({})
    `);

    expect(result.machines[0].getIsIgnored()).toEqual(false);
  });
  it('Should ignore comments that are inside the definition', () => {
    const result = parseMachinesFromFile(`
    
      createMachine(
        /** xstate-ignore-next-line */
        {}
      )
    `);

    expect(result.machines[0].getIsIgnored()).toEqual(false);
  });
});
