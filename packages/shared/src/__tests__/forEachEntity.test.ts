import { extractMachinesFromFile } from '@xstate/machine-extractor';
import { isActionEntity, isActorEntity } from '../createIntrospectableMachine';
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
							}, {actions: () => {}}],
							onError: [{
								target: 'b',
								actions: [() => {}]
							}, {actions: () => {}}]
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
      if (isActionEntity(entity)) {
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

    forEachEntity(config, (entity) => {
      if (isActionEntity(entity)) {
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

  it('Should visit all named guards and replace them', () => {
    const result = extractMachinesFromFile(`createMachine({
      initial: 'a',
      states: {
        a: {
          on: {
            event: {
              target: 'b',
              cond: 'someCond',
            },
          },
        },
        b: {
          after: {
            delay: {
              target: 'c',
              cond: () => true,
            },
          },
        },
        c: {
          on: {
            event: {
              target: 'd',
              cond: {
                type: 'parametrizedGuard',
                params: {
                  a: 1,
                },
              },
            },
          },
        },
        d: {
          invoke: {
            src: 'actor',
            onDone: {
              target: 'a',
              cond: 'someCond',
            },
            onError: {
              target: 'b',
              cond: () => true,
            },
          },
          on: {
            event: [
              { target: 'a', cond: 'someCond' },
              { target: 'b', cond: () => true },
            ],
          },
        },
      },
    })`);

    const config = result!.machines[0]!.toConfig()!;
    forEachEntity(config, (entity) => {
      if (!isActorEntity(entity) && !isActionEntity(entity)) {
        if (entity?.kind === 'named') {
          return { ...entity, type: 'anonymous' };
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
              "event": {
                "cond": {
                  "kind": "named",
                  "params": {},
                  "type": "anonymous",
                },
                "target": "b",
              },
            },
          },
          "b": {
            "after": {
              "delay": {
                "cond": {
                  "kind": "inline",
                  "params": {},
                  "type": "() => true",
                },
                "target": "c",
              },
            },
          },
          "c": {
            "on": {
              "event": {
                "cond": {
                  "kind": "named",
                  "params": {
                    "a": 1,
                  },
                  "type": "anonymous",
                },
                "target": "d",
              },
            },
          },
          "d": {
            "invoke": {
              "kind": "named",
              "onDone": {
                "cond": {
                  "kind": "named",
                  "params": {},
                  "type": "anonymous",
                },
                "target": "a",
              },
              "onError": {
                "cond": {
                  "kind": "inline",
                  "params": {},
                  "type": "() => true",
                },
                "target": "b",
              },
              "src": "actor",
            },
            "on": {
              "event": [
                {
                  "cond": {
                    "kind": "named",
                    "params": {},
                    "type": "anonymous",
                  },
                  "target": "a",
                },
                {
                  "cond": {
                    "kind": "inline",
                    "params": {},
                    "type": "() => true",
                  },
                  "target": "b",
                },
              ],
            },
          },
        },
      }
    `);
  });
  it('Should visit all inline guards and delete them', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              event: {
                target: 'b',
                cond: 'someCond'
              }
            }
          },
          b: {
            after: {
              delay: {
                target: 'c',
                cond: () => true
              }
            }
          },
          c: {
            on: {
              event: {
                target: 'd',
                cond: {
                  type: 'parametrizedGuard',
                  params: {
                    a: 1
                  }
                }
              }
            }
          },
          d: {
            invoke: {
              src: 'actor',
              onDone: {
                target: 'a',
                cond: 'someCond'
              },
              onError: {
                target: 'b',
                cond: () => true
              }
            },
            on: {
              event: [{target: 'a', cond: 'someCond'}, {target: 'b', cond: () => true}]
            }
          }
        }
      })
    `);
    const config = result!.machines[0]!.toConfig()!;
    forEachEntity(config, (entity) => {
      const isInlineGuard =
        entity &&
        !isActorEntity(entity) &&
        !isActionEntity(entity) &&
        entity?.kind === 'inline';

      return isInlineGuard ? undefined : entity;
    });

    expect(config).toMatchInlineSnapshot(`
      {
        "initial": "a",
        "states": {
          "a": {
            "on": {
              "event": {
                "cond": {
                  "kind": "named",
                  "params": {},
                  "type": "someCond",
                },
                "target": "b",
              },
            },
          },
          "b": {
            "after": {
              "delay": {
                "target": "c",
              },
            },
          },
          "c": {
            "on": {
              "event": {
                "cond": {
                  "kind": "named",
                  "params": {
                    "a": 1,
                  },
                  "type": "parametrizedGuard",
                },
                "target": "d",
              },
            },
          },
          "d": {
            "invoke": {
              "kind": "named",
              "onDone": {
                "cond": {
                  "kind": "named",
                  "params": {},
                  "type": "someCond",
                },
                "target": "a",
              },
              "onError": {
                "target": "b",
              },
              "src": "actor",
            },
            "on": {
              "event": [
                {
                  "cond": {
                    "kind": "named",
                    "params": {},
                    "type": "someCond",
                  },
                  "target": "a",
                },
                {
                  "target": "b",
                },
              ],
            },
          },
        },
      }
    `);
  });
});
