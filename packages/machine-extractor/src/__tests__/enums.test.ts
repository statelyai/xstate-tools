import { extractMachinesFromFile } from '..';

describe('Enums', () => {
  it('Should pick up state keys declared as enums and initials', () => {
    const result = extractMachinesFromFile(`
      enum MyEnum {
        First
      }

      createMachine({
        initial: MyEnum.First,
        states: {
          [MyEnum.First]: {}
        }
      })
    `);

    expect(result!.machines[0]!.toConfig()).toEqual({
      initial: '0',
      states: {
        0: {},
      },
    });
  });
});

describe('Member expressions', () => {
  it('Should pick up state keys declared as member expressions', () => {
    const result = extractMachinesFromFile(`
      const states = {
        FIRST: 'first'
      }

      createMachine({
        initial: states.FIRST,
        states: {
          [states.FIRST]: {}
        }
      })
    `);

    expect(result!.machines[0]!.toConfig()).toEqual({
      initial: 'first',
      states: {
        first: {},
      },
    });
  });
});
