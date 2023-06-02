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

  describe('Assign actions as expression', () => {
    const assignActions = [
      'assign({count: 1})',
      `assign((ctx, e) => {
        const val = e.data;
        return {
          count: val + ctx.count
        }
      })`,
      'assign({count: ctx => ctx.count + 1})',
    ];
    const config = `
      createMachine({
        initial: 'a',
        context: {count: 0},
        entry: [${assignActions}],
        exit: [${assignActions}],
        states: {
          a: {
            exit: [${assignActions}],
            on: {
              GO: {
                target: 'b',
                actions: ${assignActions[0]}
              }
            }
          },
          b: {
            entry: [${assignActions}]
          }
        }
      })
    `;
    const result = extractMachinesFromFile(config);
    const machine = result!.machines[0];

    it('should extract entry assignment', () => {
      expect(machine?.toConfig({ stringifyInlineImplementations: true })?.entry)
        .toMatchInlineSnapshot(`
        [
          "assign({count: 1})",
          "assign((ctx, e) => {
                const val = e.data;
                return {
                  count: val + ctx.count
                }
              })",
          "assign({count: ctx => ctx.count + 1})",
        ]
      `);
      expect(
        machine?.toConfig({ stringifyInlineImplementations: true })?.states?.b
          .entry,
      ).toMatchInlineSnapshot(`
        [
          "assign({count: 1})",
          "assign((ctx, e) => {
                const val = e.data;
                return {
                  count: val + ctx.count
                }
              })",
          "assign({count: ctx => ctx.count + 1})",
        ]
      `);
    });
    it('should extract exit assignment', () => {
      expect(machine?.toConfig({ stringifyInlineImplementations: true })?.exit)
        .toMatchInlineSnapshot(`
        [
          "assign({count: 1})",
          "assign((ctx, e) => {
                const val = e.data;
                return {
                  count: val + ctx.count
                }
              })",
          "assign({count: ctx => ctx.count + 1})",
        ]
      `);
      expect(
        machine?.toConfig({ stringifyInlineImplementations: true })?.states?.a
          .exit,
      ).toMatchInlineSnapshot(`
        [
          "assign({count: 1})",
          "assign((ctx, e) => {
                const val = e.data;
                return {
                  count: val + ctx.count
                }
              })",
          "assign({count: ctx => ctx.count + 1})",
        ]
      `);
    });
    it('should extract assignment from transitions actions', () => {
      expect(
        (
          machine?.toConfig({ stringifyInlineImplementations: true })?.states?.a
            .on as any
        ).GO.actions,
      ).toMatchInlineSnapshot(`"assign({count: 1})"`);
    });
  });
});
