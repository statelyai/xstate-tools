import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Options', () => {
  it('Should handle functions declared as ObjectMethod', () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actors: {
          service() {}
        }
      })
    `);

    expect(
      result!.machines[0]!.machineCallResult.options?.actors?.properties,
    ).toHaveLength(1);

    const node = result!.machines[0]!.machineCallResult.options?.actors
      ?.properties[0].property;

    expect(t.isObjectMethod(node)).toBeTruthy();
  });
});
