import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Cond', () => {
  it('Should extract v5 guards', () => {
    const result = extractMachinesFromFile(`
      createMachine({
		initial: 'a',
		states: {
			a: {
				on: {
					move: {
						target: 'b',
						guard: 'g1'
					}
				}
			},
			b: {
				on: {
					move: [{target: 'a', guard: 'g2'}, 'c']
				}
			},
			c: {}
		}
	  })
    `);

    expect(result!.machines[0]!.toConfig()).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "move": {
                "cond": "g1",
                "target": "b",
              },
            },
          },
          "b": {
            "on": {
              "move": [
                {
                  "cond": "g2",
                  "target": "a",
                },
                {
                  "target": "c",
                },
              ],
            },
          },
          "c": {},
        },
      }
    `);
  });
});
