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
						guard: 'g1',
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
                "cond": {
                  "kind": "named",
                  "params": {},
                  "type": "g1",
                },
                "target": "b",
              },
            },
          },
          "b": {
            "on": {
              "move": [
                {
                  "cond": {
                    "kind": "named",
                    "params": {},
                    "type": "g2",
                  },
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

  it('Should extract inline guards', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              move: {
                target: 'b',
                guard: () => {
                  return someCondition()
                }
              }
            }
          },
          b: {
            on: {
              move: {
                target: 'c',
                guard: someIdentifier
              }
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
                "cond": {
                  "kind": "inline",
                  "params": {},
                  "type": "() => {
                        return someCondition()
                      }",
                },
                "target": "b",
              },
            },
          },
          "b": {
            "on": {
              "move": {
                "cond": {
                  "kind": "inline",
                  "params": {},
                  "type": "someIdentifier",
                },
                "target": "c",
              },
            },
          },
          "c": {},
        },
      }
    `);
  });

  it('Should extract parametrized guards', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              move: {
                target: 'b',
                guard: {
                  type: 'named guard',
                  params: {
                    str: 'some string',
                    num: 42,
                    bool: true,
                    obj: { a: 1 },
                    arr: [1, 2, 3],
                  }
                }
              }
            }
          },
          b: {}
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
                "cond": {
                  "kind": "named",
                  "params": {
                    "arr": [
                      1,
                      2,
                      3,
                    ],
                    "bool": true,
                    "num": 42,
                    "obj": {
                      "a": 1,
                    },
                    "str": "some string",
                  },
                  "type": "named guard",
                },
                "target": "b",
              },
            },
          },
          "b": {},
        },
      }
    `);
  });
});
