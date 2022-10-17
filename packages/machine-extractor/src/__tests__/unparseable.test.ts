import { extractMachinesFromFile } from '../extractMachinesFromFile';

describe('Unparseable nodes', () => {
  describe('When it reaches an object property with the incorrect type', () => {
    it('Should ignore it instead of throwing', () => {
      const input = `
				createMachine({
					key: 12,
				})
			`;

      expect(() => extractMachinesFromFile(input)).not.toThrow();
    });
  });
});
