import { extractMachinesFromFile } from '..';

describe('Context', () => {
  it('Should be able to parse machine context into an object', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        context: {
			str: 'some string',
			num: 2,
			bool: true,
			arr: [1,2,3],
			obj: {
				str: 'some string',
			num: 2,
			bool: true,
			arr: [1,2,3],
			obj: {
				a: 2
			}
			}
		}
      })
    `);

    expect(result?.machines[0]?.toConfig()).toMatchInlineSnapshot(`
      {
        "context": {
          "arr": [
            1,
            2,
            3,
          ],
          "bool": true,
          "num": 2,
          "obj": {
            "arr": [
              1,
              2,
              3,
            ],
            "bool": true,
            "num": 2,
            "obj": {
              "a": 2,
            },
            "str": "some string",
          },
          "str": "some string",
        },
      }
    `);
  });

  it('Should only account for context on the root node', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
		states: {
			a: {
				context: {
					foo: 'bar'
				}
			}
		}
      })
    `);

    expect(result?.machines[0]?.toConfig()).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {},
        },
      }
    `);
  });

  it('Should extract lazy context as an expression string', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        context: () => ({})
      })
    `);

    expect(result?.machines[0]?.toConfig()).toMatchInlineSnapshot(`
      {
        "context": "{{() => ({})}}",
      }
    `);
  });
});
