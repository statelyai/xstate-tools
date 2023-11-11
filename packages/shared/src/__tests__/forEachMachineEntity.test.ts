import { extractMachinesFromFile } from '@xstate/machine-extractor';
import { forEachMachineEntity } from '../forEachMachineEntity';

describe('forEachMachineEntity', () => {
  it('Should visit and replace all actions', () => {
    const result = extractMachinesFromFile(`
			createMachine({
				initial: 'a',
				entry: [() => {}],
				exit: () => {},
				invoke: {
					src: 'test',
					onDone: {
						actions: [() => {}]
					},
					onError: {
						actions: () => {}
					}
				},
				states: {
					a: {
						entry: [() => {}],
						exit: () => {},
						invoke: {
							src: 'test',
							onDone: {
								target: 'b',
								actions: [() => {}]
							},
							onError: {
								target: 'b',
								actions: [() => {}]
							}
						},
					},
					b: {
						after: {
							1000: [{
								target: 'a',
								actions: () => {},
								cond: 'someCond'
							}, {
								target: 'c',
								actions: [() => {}]
							}]
						}
					},
					c: {
						on: {
							event: {
								target: 'b',
								actions: [() => {}]
							},
							always: {
								target: 'a',
								actions: () => {}
							}
						}
					}
				}
			})
		`);

    const config = result?.machines[0]?.toConfig()!;
    forEachMachineEntity(config, (entity) => {
      if (entity && 'action' in entity) {
        return { type: 'anonymous' };
      }
      if (entity && 'guard' in entity && entity.kind === 'named') {
        return entity.guard.type;
      }
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "entry": {
          "type": "anonymous",
        },
        "exit": {
          "type": "anonymous",
        },
        "initial": "a",
        "invoke": {
          "onDone": {
            "actions": {
              "type": "anonymous",
            },
          },
          "onError": {
            "actions": {
              "type": "anonymous",
            },
          },
          "src": "test",
        },
        "states": {
          "a": {
            "entry": {
              "type": "anonymous",
            },
            "exit": {
              "type": "anonymous",
            },
            "invoke": {
              "onDone": {
                "actions": {
                  "type": "anonymous",
                },
                "target": "b",
              },
              "onError": {
                "actions": {
                  "type": "anonymous",
                },
                "target": "b",
              },
              "src": "test",
            },
          },
          "b": {
            "after": {
              "1000": [
                {
                  "actions": {
                    "type": "anonymous",
                  },
                  "cond": "someCond",
                  "target": "a",
                },
                {
                  "actions": {
                    "type": "anonymous",
                  },
                  "target": "c",
                },
              ],
            },
          },
          "c": {
            "on": {
              "always": {
                "actions": {
                  "type": "anonymous",
                },
                "target": "a",
              },
              "event": {
                "actions": {
                  "type": "anonymous",
                },
                "target": "b",
              },
            },
          },
        },
      }
    `);
  });

  it('Should delete the action in-place if visitor returns falsy', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              FOO: 'b'
            }
          },
          b: {
            after: {
              delay: {
                actions: ['some named action', assign({})]
              }
            }
          }
        }
      })
    `);

    const config = result?.machines[0]?.toConfig()!;

    forEachMachineEntity(config, (entity) => {
      if (entity && 'action' in entity && entity?.kind === 'builtin') {
        return;
      }
      if (entity && 'guard' in entity && entity.kind === 'named') {
        return entity.guard.type;
      }
      return entity;
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "FOO": {
                "target": "b",
              },
            },
          },
          "b": {
            "after": {
              "delay": {
                "actions": [
                  {
                    "action": {
                      "params": {},
                      "type": "some named action",
                    },
                    "kind": "named",
                  },
                ],
              },
            },
          },
        },
      }
    `);
  });

  it('Should visit and replace all guards', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              FOO: {target: 'b', cond: 'someCond'}
            }
          },
          b: {
            after: {
              delay: [{
                target: 'a',
                cond: 'anotherCond'
              }, {target: 'c', cond: 'thirdCond'}]
            }
          },
          c: {}
        }
      })
    `);

    const config = result?.machines[0]?.toConfig()!;

    forEachMachineEntity(config, (entity) => {
      if (entity && 'guard' in entity && entity.kind === 'named') {
        return entity.guard.type;
      }
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "FOO": {
                "cond": "someCond",
                "target": "b",
              },
            },
          },
          "b": {
            "after": {
              "delay": [
                {
                  "cond": "anotherCond",
                  "target": "a",
                },
                {
                  "cond": "thirdCond",
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

  it('Should visit and replace guards in choose actions', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              FOO: {target: 'b', actions: choose([
                {
                  actions: [],
                  cond: "cond1",
                },
                {
                  actions: [],
                  cond: "cond2",
                },
              ])}
            }
          },
          b: {}
        }
      })
    `);

    const config = result?.machines[0]?.toConfig()!;

    forEachMachineEntity(config, (entity) => {
      if (
        entity &&
        'action' in entity &&
        entity.kind === 'inline' &&
        entity.action.__tempStatelyChooseConds
      ) {
        return {
          type: 'xstate.choose',
          conds: entity.action.__tempStatelyChooseConds,
        };
      }
      if (entity && 'guard' in entity && entity.kind === 'named') {
        return entity.guard.type;
      }
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "FOO": {
                "actions": {
                  "conds": [
                    {
                      "actions": [],
                      "cond": "cond1",
                    },
                    {
                      "actions": [],
                      "cond": "cond2",
                    },
                  ],
                  "type": "xstate.choose",
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
