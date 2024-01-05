import { extractMachinesFromFile } from '@xstate/machine-extractor';
import { isActorEntity } from '../createIntrospectableMachine';
import { forEachEntity } from '../forEachEntity';

describe('forEachEntity', () => {
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
							onDone: [{
								target: 'b',
								actions: [() => {}]
							}, {onDone: () => {}}],
							onError: [{
								target: 'b',
								actions: [() => {}]
							}, {onDone: () => {}}]
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
    forEachEntity(config, (entity) => {
      if (!isActorEntity(entity)) {
        return { type: 'anonymous' };
      }
      return entity;
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
          "kind": "named",
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
              "kind": "named",
              "onDone": [
                {
                  "actions": {
                    "type": "anonymous",
                  },
                  "target": "b",
                },
                {
                  "actions": {
                    "type": "anonymous",
                  },
                },
              ],
              "onError": [
                {
                  "actions": {
                    "type": "anonymous",
                  },
                  "target": "b",
                },
                {
                  "actions": {
                    "type": "anonymous",
                  },
                },
              ],
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
                  "cond": {
                    "kind": "named",
                    "params": {},
                    "type": "someCond",
                  },
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
            "entry": {
              "type": "anonymous",
            },
            "exit": {
              "type": "anonymous",
            },
            "invoke": {
              "type": "anonymous",
            },
          },
          "c": {
            "entry": {
              "type": "anonymous",
            },
            "exit": {
              "type": "anonymous",
            },
            "invoke": {
              "type": "anonymous",
            },
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

    forEachEntity(config, (entity) => {
      if (!isActorEntity(entity)) {
        if (entity?.kind === 'builtin') {
          return;
        }
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

  it('Should visit and replace all actors', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        invoke: {
          src: 'named actor'
        },
        states: {
          a: {
            invoke: [
              {src: () => {}},
              {src: () => () => {}},
              {src: someIdentifier},
              {src: 'another named actor'}
            ]
          }
        }
      })
    `);

    const config = result?.machines[0]?.toConfig()!;

    // Only replace inline actors
    forEachEntity(config, (entity) => {
      if (isActorEntity(entity)) {
        if (entity.kind === 'inline') {
          return { ...entity, src: 'anonymous' };
        }
      }
      return entity;
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "invoke": {
          "kind": "named",
          "src": "named actor",
        },
        "states": {
          "a": {
            "invoke": [
              {
                "kind": "inline",
                "src": "anonymous",
              },
              {
                "kind": "inline",
                "src": "anonymous",
              },
              {
                "kind": "inline",
                "src": "anonymous",
              },
              {
                "kind": "named",
                "src": "another named actor",
              },
            ],
          },
        },
      }
    `);
  });

  it('Should delete actors', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        invoke: {
          src: 'named actor'
        },
        states: {
          a: {
            invoke: [
              {src: () => {}},
              {src: () => () => {}},
              {src: someIdentifier},
              {src: 'another named actor'}
            ]
          }
        }
      })
    `);

    const config = result?.machines[0]?.toConfig()!;

    // Only delete inline actors
    forEachEntity(config, (entity) => {
      if (isActorEntity(entity)) {
        if (entity.kind === 'inline') {
          return;
        }
      }
      return entity;
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "invoke": {
          "kind": "named",
          "src": "named actor",
        },
        "states": {
          "a": {
            "invoke": [
              {
                "kind": "named",
                "src": "another named actor",
              },
            ],
          },
        },
      }
    `);
  });
});
