import { extractMachinesFromFile } from '..';

describe('Type parameter parsing', () => {
  it('Should parse the correct params', () => {
    const fileText = `
      createMachine<Context, Event, any, any>({});
    `;
    const result = extractMachinesFromFile(fileText)!;

    expect(
      result.machines[0]!.machineCallResult?.typeArguments?.params,
    ).toHaveLength(4);

    const sliceOfResult = fileText.slice(
      result.machines[0]!.machineCallResult?.typeArguments?.node.start!,
      result.machines[0]!.machineCallResult?.typeArguments?.node.end!,
    );

    expect(sliceOfResult).toEqual('<Context, Event, any, any>');
  });
});
