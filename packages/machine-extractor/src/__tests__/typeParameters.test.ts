import { parseMachinesFromFile } from '..';

describe('Type parameter parsing', () => {
  it('Should parse the correct params', () => {
    const fileText = `
      createMachine<Context, Event, any, any>({});
    `;
    const result = parseMachinesFromFile(fileText);

    expect(result.machines[0].ast?.typeArguments?.params).toHaveLength(4);

    const sliceOfResult = fileText.slice(
      result.machines[0].ast?.typeArguments?.node.start!,
      result.machines[0].ast?.typeArguments?.node.end!,
    );

    expect(sliceOfResult).toEqual('<Context, Event, any, any>');
  });
});
