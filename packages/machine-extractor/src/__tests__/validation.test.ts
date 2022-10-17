import { extractMachinesFromFile } from '../extractMachinesFromFile';

describe('Validation and failsafes', () => {
  describe('When the code does not contain createMachine or Machine', () => {
    it('Should return null', () => {
      expect(
        extractMachinesFromFile(`
        const hello = 2;
      `),
      ).toBe(null);
    });
  });
});
