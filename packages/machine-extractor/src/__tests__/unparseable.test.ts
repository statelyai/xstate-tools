import { parseMachinesFromFile } from '../parseMachinesFromFile';

describe('Unparseable nodes', () => {
  describe('When it reaches an object property with the incorrect type', () => {
    it('Should ignore it instead of throwing', () => {
      const input = `
				createMachine({
					key: 12,
				})
			`;

      expect(() => parseMachinesFromFile(input)).not.toThrow();
    });
  });
});
