import { extractMachinesFromFile } from '@xstate/machine-extractor';
import { forEachAction } from '../forEachAction';

describe('forEachAction', () => {
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
    forEachAction(config, (action) => {
      return { type: 'anonymous' };
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
            "entry": {
              "type": "anonymous",
            },
            "exit": {
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

    forEachAction(config, (action) => {
      if (action?.kind === 'builtin') {
        return;
      }
      return action;
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
});
