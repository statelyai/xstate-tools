import { groupByUniqueName, MachineExtractResult } from '..';
import { extractMachinesFromFile } from '../extractMachinesFromFile';

function getTestMachineConfig(configStr: string) {
  const result = extractMachinesFromFile(configStr);
  const machine = result!.machines[0];
  const config = machine?.toConfig()!;

  return config;
}

describe('MachineParseResult', () => {
  it('Should let you get a state node by path', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        states: {
          a: {},
          b: {
            states: {
              b1: {}
            }
          }
        },
      })
    `);

    const machine = result!.machines[0]!;

    expect(machine.getAllStateNodes()).toHaveLength(4);

    const aNode = machine.getStateNodeByPath(['a']);

    expect(aNode?.path).toEqual(['a']);

    const b1Node = machine.getStateNodeByPath(['b', 'b1']);

    expect(b1Node?.path).toEqual(['b', 'b1']);
  });

  it('Should let you list all of the transition target nodes', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        onDone: ['state.onDone'],
        invoke: {
          onDone: ['invoke.onDone'],
          onError: ['invoke.onError']
        },
        always: ['always'],
        states: {
          a: {
            on: {
              WOW: [{
                target: 'WOW.object'
              }, 'WOW.string']
            }
          },
        },
      })
    `);

    const targets = result!.machines[0]!.getTransitionTargets();

    // Doing a map here to improve the error messaging
    expect(
      targets.map((target) => target.target.map((target) => target.value)),
    ).toHaveLength(6);
  });

  it('Should let you list all of the named guards', () => {
    const result = extractMachinesFromFile(`
    createMachine({
      onDone: [{cond: 'state.onDone'}],
      invoke: {
        onDone: [{cond: 'invoke.onDone'}],
        onError: [{cond: 'invoke.onError'}]
      },
      always: [{cond: 'always'}],
      states: {
        a: {
          on: {
            WOW: [{
              cond: 'WOW.object'
            }, {
              cond: 'WOW.object'
            }]
          }
        },
      },
    })
    `);

    const conds = groupByUniqueName(
      result!.machines[0]!.getAllConds(['named']),
    );

    expect(Object.keys(conds)).toHaveLength(5);

    expect(conds['WOW.object']).toHaveLength(2);
  });

  it('Should grab all invoke names', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        invoke: {
          src: 'cool'
        }
      })
    `);

    const services = result!.machines[0]!.getAllServices(['named']);

    expect(Object.keys(services)).toHaveLength(1);
  });

  it('should grab target defined with a template literal', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: \`b\`
            }
          },
          b: {}
        }
      })
    `);

    const [transition] = result!.machines[0]!.getTransitionTargets();

    expect({
      from: transition.fromPath,
      to: transition.target.map((t) => t.value),
    }).toEqual({
      from: ['a'],
      to: ['b'],
    });
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
        "assignment": {
          "type": "expression",
          "value": "(ctx, e) => {
                    const val = e.data;
                    return {
                      count: val + ctx.count,
                    };
                  }",
        },
        "type": "xstate.assign",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "assignment": {
          "type": "expression",
          "value": "function (ctx, e) {
                  const val = e.data;
                  return {
                    count: val + ctx.count,
                  };
                }",
        },
        "type": "xstate.assign",
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
                e: [1,2,3],
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
        "assignment": {
          "type": "object",
          "value": {
            "a": {
              "type": "expression",
              "value": "ctx => ctx.count + 1",
            },
            "b": {
              "type": "expression",
              "value": "function (ctx, e) {
                        return ctx.whatever + e.anotherWhatever
                      }",
            },
            "c": {
              "type": "number",
              "value": 2,
            },
            "d": {
              "type": "string",
              "value": "some string",
            },
            "e": {
              "type": "expression",
              "value": "[1,2,3]",
            },
            "f": {
              "type": "expression",
              "value": "{f1: {}}",
            },
          },
        },
        "type": "xstate.assign",
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
        "assignment": {
          "type": "expression",
          "value": "{...someVar, count: 1}",
        },
        "type": "xstate.assign",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "assignment": {
          "type": "expression",
          "value": "anotherVar",
        },
        "type": "xstate.assign",
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
        "event": {
          "type": "expression",
          "value": "(ctx, evt) => {}",
        },
        "type": "xstate.raise",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "event": {
          "type": "expression",
          "value": "function() {}",
        },
        "type": "xstate.raise",
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
            raise({type: 'Some event', foo: 'foo', bar: true, baz: [1,2,3], obj: {prop: {prop2: 2}}}),
          ],
        }
      }
    });
  `);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "event": {
          "type": "object",
          "value": {
            "bar": {
              "type": "boolean",
              "value": true,
            },
            "baz": {
              "type": "expression",
              "value": "[1,2,3]",
            },
            "foo": {
              "type": "string",
              "value": "foo",
            },
            "obj": {
              "type": "expression",
              "value": "{prop: {prop2: 2}}",
            },
            "type": {
              "type": "string",
              "value": "Some event",
            },
          },
        },
        "type": "xstate.raise",
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
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "Event type",
            },
          },
        },
        "type": "xstate.raise",
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
        "event": {
          "type": "expression",
          "value": "{...someVar, bar: 'foo'}",
        },
        "type": "xstate.raise",
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
        "expr": {
          "type": "string",
          "value": "Some string",
        },
        "type": "xstate.log",
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
        "expr": {
          "type": "expression",
          "value": "log(() => {})",
        },
        "type": "xstate.log",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "expr": {
          "type": "expression",
          "value": "log(function() {})",
        },
        "type": "xstate.log",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "() => {}",
        },
        "type": "xstate.sendTo",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "function() {}",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "someVar",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "() => {}",
        },
        "type": "xstate.sendTo",
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
            sendTo(() => {}, {type: 'event type', userId: 2})
          ]
        }
      }
    });
  `);

    expect(config.states!.a.entry).toMatchInlineSnapshot(`
      {
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event type",
            },
            "userId": {
              "type": "number",
              "value": 2,
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "() => {}",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "expression",
          "value": "{...someVar, type: 'event'}",
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "() => {}",
        },
        "type": "xstate.sendTo",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "delay": undefined,
        "event": {
          "type": "expression",
          "value": "someEvent",
        },
        "id": undefined,
        "to": {
          "type": "expression",
          "value": "() => {}",
        },
        "type": "xstate.sendTo",
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
        "delay": {
          "type": "string",
          "value": "namedDelay",
        },
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": {
          "type": "number",
          "value": 234,
        },
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": {
          "type": "expression",
          "value": "() => {}",
        },
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "delay": {
          "type": "expression",
          "value": "function() {}",
        },
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": {
          "type": "expression",
          "value": "somevar",
        },
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": undefined,
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": {
          "type": "string",
          "value": "namedId",
        },
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
      }
    `);
  });

  it('should extract sendTo with a number id', () => {
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": {
          "type": "number",
          "value": 234,
        },
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": {
          "type": "expression",
          "value": "() => {}",
        },
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
      }
    `);
    expect(config.states!.a.exit).toMatchInlineSnapshot(`
      {
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": {
          "type": "expression",
          "value": "function() {}",
        },
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "delay": undefined,
        "event": {
          "type": "object",
          "value": {
            "type": {
              "type": "string",
              "value": "event",
            },
          },
        },
        "id": {
          "type": "expression",
          "value": "somevar",
        },
        "to": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.sendTo",
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
        "id": {
          "type": "string",
          "value": "actor",
        },
        "type": "xstate.stop",
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
        "id": {
          "type": "expression",
          "value": "2n",
        },
        "type": "xstate.stop",
      }
    `);
  });
});
