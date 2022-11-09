import { extractMachinesFromFile } from '../extractMachinesFromFile';

it('Should handle createTestMachine', () => {
  const machines = extractMachinesFromFile(`
  	createTestMachine({});
  `);

  const result = machines!.machines[0];

  expect(result).toBeTruthy();
});
