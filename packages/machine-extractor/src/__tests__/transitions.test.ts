import { extractMachinesFromFile } from '..';

describe('Internal transitions', () => {
  it('Should keep internal property on internal transitions', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
		states: {
			a: {
				on: {
					move: {
						target: 'b',
						internal: true
					}
				},
				invoke: {
					src: 'actor',
					onDone: {
						internal: true
					},
					onError: {internal: true}
				}
			},
			b: {
				after: {
					100: {
						target: 'c',
						internal: true
					}
				},
				always: {target: 'a', internal: true},
				onDone: {
					internal: true
				}
			}
		}
      })
    `);

    expect(result?.machines[0]?.toConfig()).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "invoke": {
              "onDone": {
                "internal": true,
              },
              "onError": {
                "internal": true,
              },
              "src": "actor",
            },
            "on": {
              "move": {
                "internal": true,
                "target": "b",
              },
            },
          },
          "b": {
            "after": {
              "100": {
                "internal": true,
                "target": "c",
              },
            },
            "always": {
              "internal": true,
              "target": "a",
            },
            "onDone": {
              "internal": true,
            },
          },
        },
      }
    `);
  });

  it('Should leave out internal property if transition is has internal set to false', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
		states: {
			a: {
				on: {
          baz: {
            internal: false
          }
				}
			}
		}
      })
    `);

    expect(result?.machines[0]?.toConfig()).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "baz": {},
            },
          },
        },
      }
    `);
  });

  it('Should leave out internal property if transition is missing internal property', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
		states: {
			a: {
				on: {
					foo: {
						target: 'b'
					},
					bar: 'c',
				}
			}
		}
      })
    `);

    expect(result?.machines[0]?.toConfig()).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "bar": {
                "target": "c",
              },
              "foo": {
                "target": "b",
              },
            },
          },
        },
      }
    `);
  });
});
