import { extractMachinesFromFile } from '../extractMachinesFromFile';

function getTestMachineConfig(configStr: string) {
  const result = extractMachinesFromFile(configStr);
  const machine = result!.machines[0];
  const config = machine?.toConfig()!;

  return config;
}

describe('extract actions', () => {
  it('Ensures actions are extracted with the correct `kind`', () => {
    const config = getTestMachineConfig(`createMachine({
			entry: [
			  () => {},
			  {type: 'custom name', params: {foo: 'bar', arr: [1, [2], [{a: 3}]], obj: {a: {b: [{c: 1}]}}}},
			  {type: someIdentifier, params: {foo: 'bar'}},
			  {type: 'xstate.assign', assignment: {foo: 'bar', baz: () => {}}},
			  anotherIdentifier,
			  assign({foo: 'bar', baz: someExpression}),
			  assign(anythingOtherThanPlainObject),
			]
		  })`);
    expect(config.entry).toMatchInlineSnapshot(`
      [
        {
          "action": {
            "expr": "{{() => {}}}",
          },
          "kind": "inline",
        },
        {
          "action": {
            "params": {
              "arr": [
                1,
                [
                  2,
                ],
                [
                  {
                    "a": 3,
                  },
                ],
              ],
              "foo": "bar",
              "obj": {
                "a": {
                  "b": [
                    {
                      "c": 1,
                    },
                  ],
                },
              },
            },
            "type": "custom name",
          },
          "kind": "named",
        },
        {
          "action": {
            "expr": "{{{type: someIdentifier, params: {foo: 'bar'}}}}",
          },
          "kind": "inline",
        },
        {
          "action": {
            "expr": "{{{type: 'xstate.assign', assignment: {foo: 'bar', baz: () => {}}}}}",
          },
          "kind": "inline",
        },
        {
          "action": {
            "expr": "{{anotherIdentifier}}",
          },
          "kind": "inline",
        },
        {
          "action": {
            "assignment": {
              "baz": "{{someExpression}}",
              "foo": "bar",
            },
            "type": "xstate.assign",
          },
          "kind": "builtin",
        },
        {
          "action": {
            "assignment": "{{anythingOtherThanPlainObject}}",
            "type": "xstate.assign",
          },
          "kind": "builtin",
        },
      ]
    `);
  });
  it('should extract inline expressions as inline actions', () => {
    const config = getTestMachineConfig(
      `
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [() => {}],
			exit: [someVar]
		  }
		},
	  });
	`,
    );
    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{() => {}}}",
        },
        "kind": "inline",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{someVar}}",
        },
        "kind": "inline",
      }
    `);
  });

  it('should extract action objects as inline actions', () => {
    const config = getTestMachineConfig(
      `
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [{type: someIdentifier, params: {foo: 'bar'}}],
			exit: [{type: 'xstate.assign', assignment: {foo: 'bar', baz: () => {}}}]
		  }
		},
	  });
	`,
    );
    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{{type: someIdentifier, params: {foo: 'bar'}}}}",
        },
        "kind": "inline",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{{type: 'xstate.assign', assignment: {foo: 'bar', baz: () => {}}}}}",
        },
        "kind": "inline",
      }
    `);
  });

  it('should extract builtin actions unsupported by Stately Studio, as inline actions', () => {
    const config = getTestMachineConfig(
      `
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [forwardTo('some id')],
			exit: [respond({ type: 'TOKEN' }, { delay: 10 })]
		  },
		  b: {
			entry: [escalate({ message: 'This is some error' })],
			exit: [pure((context, event) => {
			  return context.sampleActors.map((sampleActor) => {
				return send('SOME_EVENT', { to: sampleActor });
			  });
			})]
		  }
		},
	  });
	`,
    );
    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{forwardTo('some id')}}",
        },
        "kind": "inline",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{respond({ type: 'TOKEN' }, { delay: 10 })}}",
        },
        "kind": "inline",
      }
    `);
    expect(config.states!.b.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{escalate({ message: 'This is some error' })}}",
        },
        "kind": "inline",
      }
    `);
    expect(config.states!.b.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{pure((context, event) => {
      			  return context.sampleActors.map((sampleActor) => {
      				return send('SOME_EVENT', { to: sampleActor });
      			  });
      			})}}",
        },
        "kind": "inline",
      }
    `);
  });

  it('should extract assign with a callback', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  assign((ctx, e) => {
				const val = e.data;
				return {
				  count: val + ctx.count,
				};
			  })
			],
			exit: [assign(function (ctx, e) {
			  const val = e.data;
			  return {
				count: val + ctx.count,
			  };
			})],
		  },
		},
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "assignment": "{{(ctx, e) => {
      				const val = e.data;
      				return {
      				  count: val + ctx.count,
      				};
      			  }}}",
          "type": "xstate.assign",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "assignment": "{{function (ctx, e) {
      			  const val = e.data;
      			  return {
      				count: val + ctx.count,
      			  };
      			}}}",
          "type": "xstate.assign",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract assign with an object', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  assign(
				{
				  a: ctx => ctx.count + 1,
				  b: function (ctx, e) {
					return ctx.whatever + e.anotherWhatever
				  },
				  c: 2,
				  d: 'some string',
				  e: [1,2,3, [4,[5]]],
				  f: {f1: {}}
				}
			  )
			],
		  },
		},
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "assignment": {
            "a": "{{ctx => ctx.count + 1}}",
            "b": "{{function (ctx, e) {
      					return ctx.whatever + e.anotherWhatever
      				  }}}",
            "c": 2,
            "d": "some string",
            "e": [
              1,
              2,
              3,
              [
                4,
                [
                  5,
                ],
              ],
            ],
            "f": {
              "f1": {},
            },
          },
          "type": "xstate.assign",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract assign with any other expression', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: 'a',
		states: {
		  a: {
			entry: [assign({...someVar, count: 1})],
			exit: [assign(anotherVar)]
		  }
		}
	  })
	  `);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "assignment": "{{{...someVar, count: 1}}}",
          "type": "xstate.assign",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "assignment": "{{anotherVar}}",
          "type": "xstate.assign",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract raise with a callback', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  raise((ctx, evt) => {})
			],
			exit: [
			  raise(function() {})
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": "{{(ctx, evt) => {}}}",
          "type": "xstate.raise",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "event": "{{function() {}}}",
          "type": "xstate.raise",
        },
        "kind": "builtin",
      }
    `);
  });
  it('should extract raise with an object', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  raise({type: 'Some event', foo: 'foo', bar: true, baz: [1,[2],{a: 3},null, 'some string', true], obj: {prop: {prop2: [2]}}}),
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "bar": true,
            "baz": [
              1,
              [
                2,
              ],
              {
                "a": 3,
              },
              null,
              "some string",
              true,
            ],
            "foo": "foo",
            "obj": {
              "prop": {
                "prop2": [
                  2,
                ],
              },
            },
            "type": "Some event",
          },
          "type": "xstate.raise",
        },
        "kind": "builtin",
      }
    `);
  });
  it('should extract raise with a string', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  raise('Event type'),
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "Event type",
          },
          "type": "xstate.raise",
        },
        "kind": "builtin",
      }
    `);
  });
  it('should extract raise with any other expressions', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  raise({...someVar, bar: 'foo'}),
			],
			exit: [raise(someVar)]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": "{{{...someVar, bar: 'foo'}}}",
          "type": "xstate.raise",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "event": "{{someVar}}",
          "type": "xstate.raise",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract log with a string', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  log('Some string'),
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "Some string",
          "type": "xstate.log",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract log with a callback', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  log(() => {}),
			],
			exit: [
			  log(function() {})
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{() => {}}}",
          "type": "xstate.log",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "expr": "{{function() {}}}",
          "type": "xstate.log",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a string actor id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event')
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a callback actor id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo(() => {}, 'event')
			],
			exit: [
			  sendTo(function() {}, 'event')
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "to": "{{() => {}}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "to": "{{function() {}}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo any expressions for actor id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo(someVar, 'event')
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "to": "{{someVar}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a string event', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo(() => {}, 'event')
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "to": "{{() => {}}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a an object event', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo(() => {}, {type: 'event type', userId: 2, arr: [1, [2], {a: 3}], obj: {a: [{b: 2}]}})
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "arr": [
              1,
              [
                2,
              ],
              {
                "a": 3,
              },
            ],
            "obj": {
              "a": [
                {
                  "b": 2,
                },
              ],
            },
            "type": "event type",
            "userId": 2,
          },
          "to": "{{() => {}}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with any expressions for event', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo(() => {}, {...someVar, type: 'event'})
			],
			exit: [
			  sendTo(() => {}, someEvent)
			]
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": "{{{...someVar, type: 'event'}}}",
          "to": "{{() => {}}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "event": "{{someEvent}}",
          "to": "{{() => {}}}",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a string delay', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {delay: 'namedDelay'})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "delay": "namedDelay",
          "event": {
            "type": "event",
          },
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a number delay', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {delay: 2.34e2})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "delay": 234,
          "event": {
            "type": "event",
          },
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a callback delay', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {delay: () => {}})
			],
			exit: [
			  sendTo('actor', 'event', {delay: function() {}})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "delay": "{{() => {}}}",
          "event": {
            "type": "event",
          },
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "delay": "{{function() {}}}",
          "event": {
            "type": "event",
          },
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with any expressions for delay', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {delay: somevar})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "delay": "{{somevar}}",
          "event": {
            "type": "event",
          },
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a string id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {id: 'namedId'})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "id": "namedId",
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a number id as string id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {id: 2.34e2})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "id": "234",
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with a callback id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {id: () => {}})
			],
			exit: [
			  sendTo('actor', 'event', {id: function() {}})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "id": "{{() => {}}}",
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "id": "{{function() {}}}",
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('should extract sendTo with any expressions for id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  sendTo('actor', 'event', {id: somevar})
			],
		  }
		}
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "event": {
            "type": "event",
          },
          "id": "{{somevar}}",
          "to": "actor",
          "type": "xstate.sendTo",
        },
        "kind": "builtin",
      }
    `);
  });

  it('Should extract stop with a string id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  stop('actor')
			],
		  },
		},
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "id": "actor",
          "type": "xstate.stop",
        },
        "kind": "builtin",
      }
    `);
  });

  it('Should extract stop with a number id as string id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  stop(234)
			],
		  },
		},
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "id": "{{234}}",
          "type": "xstate.stop",
        },
        "kind": "builtin",
      }
    `);
  });

  it('Should extract stop with a number id', () => {
    const config = getTestMachineConfig(`
	  createMachine({
		initial: "a",
		states: {
		  a: {
			entry: [
			  stop(2n)
			],
		  },
		},
	  });
	`);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "action": {
          "id": "{{2n}}",
          "type": "xstate.stop",
        },
        "kind": "builtin",
      }
    `);
  });
});
