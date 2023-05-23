import omit from 'lodash.omit';
import pick from 'lodash.pick';
import { groupByUniqueName, MachineExtractResult } from '..';
import { extractMachinesFromFile } from '../extractMachinesFromFile';

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

  it('should extract assignment actions', () => {
    const result = extractMachinesFromFile(`
    createMachine({
      initial: "a",
      context: { count: 0 },
      entry: [
        assign((ctx, e) => {
          const val = e.data;
          return {
            count: val + ctx.count,
          };
        }),
        assign(function (ctx, e) {
          const val = e.data;
          return {
            count: val + ctx.count,
          };
        }),
      ],
      states: {
        a: {
          exit: [assign({count: ctx => ctx.count + 1, another: function (ctx, e) {
            return ctx.whatever + e.anotherWhatever
          }})],
          on: {
            FOO: {
              target: 'b',
              actions: [assign({a: 0, b: 'b', c: true, d: [1,2,3], e: {e1: 'whatever'}})]
            }
          },
        },
        b: {},
      },
    });
  `);
    const machine = result!.machines[0];
    const config = machine?.toConfig();

    expect(config!.entry!.map((entry) => pick(entry, ['name', 'assignment'])))
      .toMatchInlineSnapshot(`
      [
        {
          "assignment": {
            "inlineImplementation": {
              "type": "expression",
              "value": "(ctx, e) => {
                const val = e.data;
                return {
                  count: val + ctx.count,
                };
              }",
            },
          },
          "name": "xstate.assign",
        },
        {
          "assignment": {
            "inlineImplementation": {
              "type": "expression",
              "value": "function (ctx, e) {
                const val = e.data;
                return {
                  count: val + ctx.count,
                };
              }",
            },
          },
          "name": "xstate.assign",
        },
      ]
    `);

    expect(pick(config?.states.a.exit, ['name', 'assignment']))
      .toMatchInlineSnapshot(`
      {
        "assignment": {
          "another": {
            "type": "expression",
            "value": "function (ctx, e) {
                  return ctx.whatever + e.anotherWhatever
                }",
          },
          "count": {
            "type": "expression",
            "value": "ctx => ctx.count + 1",
          },
        },
        "name": "xstate.assign",
      }
    `);

    ['a', 'b', 'c', 'd', 'e'].forEach((prop) => {
      expect(config?.states?.a?.on?.FOO?.actions.assignment).toHaveProperty(
        prop,
      );
    });
    expect(pick(config?.states?.a?.on?.FOO?.actions, ['name', 'assignment']))
      .toMatchInlineSnapshot(`
      {
        "assignment": {
          "a": {
            "type": "number",
            "value": 0,
          },
          "b": {
            "type": "string",
            "value": "b",
          },
          "c": {
            "type": "boolean",
            "value": true,
          },
          "d": {
            "type": "expression",
            "value": "[1,2,3]",
          },
          "e": {
            "type": "expression",
            "value": "{e1: 'whatever'}",
          },
        },
        "name": "xstate.assign",
      }
    `);
  });

  it('should extract raise actions', () => {
    const result = extractMachinesFromFile(`
    createMachine({
      initial: "a",
      context: { count: 0 },
      entry: [
        raise({type: 'Some event', foo: 'foo', bar: true, baz: [1,2,3], obj: {prop: {prop2: 2}}}),
        raise('Some other event')
      ],
    });
  `);
    const machine = result!.machines[0];
    const config = machine?.toConfig();

    ['type', 'foo', 'bar', 'baz', 'obj'].forEach((prop) => {
      expect(config!.entry![0].event).toHaveProperty(prop);
    });
    expect(config!.entry!.map((entry) => omit(entry, ['type'])))
      .toMatchInlineSnapshot(`
      [
        {
          "event": {
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
          "name": "xstate.raise",
        },
        {
          "event": {
            "type": {
              "type": "string",
              "value": "Some other event",
            },
          },
          "name": "xstate.raise",
        },
      ]
    `);
  });

  it('should extract log action expression', () => {
    const result = extractMachinesFromFile(`
    createMachine({
      initial: "a",
      context: { count: 0 },
      entry: [
        log((ctx, e) => {}),
        raise('Some string')
      ]
    });
  `);
    const machine = result!.machines[0];
    const config = machine?.toConfig();

    expect(config!.entry!.map((entry) => omit(entry, ['type'])))
      .toMatchInlineSnapshot(`
      [
        {
          "expr": {
            "type": "expression",
            "value": "log((ctx, e) => {})",
          },
          "name": "xstate.log",
        },
        {
          "event": {
            "type": {
              "type": "string",
              "value": "Some string",
            },
          },
          "name": "xstate.raise",
        },
      ]
    `);
  });

  it('Should extract sendTo expression', () => {
    const result = extractMachinesFromFile(`
    createMachine({
      initial: "a",
      states: {
        a: {
          entry: [
            sendTo('actor', 'event'),
            sendTo('actor', {type: 'event', id: 1}),
            sendTo('actor', () => ({type: 'event', id: 1})),
            sendTo((ctx) => ctx.actorRef, 'event'),
            sendTo((ctx) => ctx.actorRef, {type: 'event', id: 1}),
            sendTo((ctx) => ctx.actorRef, () => ({type: 'event', id: 1})),
            sendTo('actor', 'event', {delay: 2000, id: 2}),
            sendTo('actor', 'event', {delay: 'namedDelay', id: 'cancellationId'}),
            sendTo('actor', 'event', {delay: () => 'namedDelay'}),
            sendTo('actor', 'event', {delay: function () {return 2000}}),
          ],
        },
      },
    });    
  `);
    const machine = result!.machines[0];
    const config = machine?.toConfig();

    expect(config!.states!.a!.entry!.map((entry) => omit(entry, ['type'])))
      .toMatchInlineSnapshot(`
      [
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": undefined,
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "id": {
                "type": "number",
                "value": 1,
              },
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": undefined,
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "type": "expression",
              "value": "() => ({type: 'event', id: 1})",
            },
            "options": {
              "delay": undefined,
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "expression",
              "value": "(ctx) => ctx.actorRef",
            },
            "event": {
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": undefined,
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "expression",
              "value": "(ctx) => ctx.actorRef",
            },
            "event": {
              "id": {
                "type": "number",
                "value": 1,
              },
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": undefined,
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "expression",
              "value": "(ctx) => ctx.actorRef",
            },
            "event": {
              "type": "expression",
              "value": "() => ({type: 'event', id: 1})",
            },
            "options": {
              "delay": undefined,
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": {
                "type": "number",
                "value": 2000,
              },
              "id": {
                "type": "number",
                "value": 2,
              },
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": {
                "type": "string",
                "value": "namedDelay",
              },
              "id": {
                "type": "string",
                "value": "cancellationId",
              },
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": {
                "type": "expression",
                "value": "delay: () => 'namedDelay'",
              },
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
        {
          "expr": {
            "actorRef": {
              "type": "string",
              "value": "actor",
            },
            "event": {
              "type": {
                "type": "string",
                "value": "event",
              },
            },
            "options": {
              "delay": {
                "type": "expression",
                "value": "delay: function () {return 2000}",
              },
              "id": undefined,
            },
          },
          "name": "xstate.sendTo",
        },
      ]
    `);
  });

  it('Should extract stop expressions', () => {
    const result = extractMachinesFromFile(`
    createMachine({
      initial: "a",
      states: {
        a: {
          entry: [
            stop('actor'),
            stop(() => 'actor'),
            stop(function (ctx) {
              return ctx.actorRef
            })
          ],
        },
      },
    });    
  `);
    const machine = result!.machines[0];
    const config = machine?.toConfig();

    expect(config!.states!.a!.entry!.map((entry) => omit(entry, ['type'])))
      .toMatchInlineSnapshot(`
      [
        {
          "expr": {
            "type": "string",
            "value": "actor",
          },
          "name": "xstate.stop",
        },
        {
          "expr": {
            "type": "expression",
            "value": "() => 'actor'",
          },
          "name": "xstate.stop",
        },
        {
          "expr": {
            "type": "expression",
            "value": "function (ctx) {
                    return ctx.actorRef
                  }",
          },
          "name": "xstate.stop",
        },
      ]
    `);
  });
});
