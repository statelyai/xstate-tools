import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Options', () => {
  it('Should handle functions declared as ObjectMethod', () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        services: {
          service() {}
        }
      })
    `);

    expect(
      result!.machines[0]!.machineCallResult.options?.services?.properties,
    ).toHaveLength(1);

    const node =
      result!.machines[0]!.machineCallResult.options?.services?.properties[0]
        .property;

    expect(t.isObjectMethod(node)).toBeTruthy();
  });
});
