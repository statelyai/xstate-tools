import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Options', () => {
  it('Should handle functions declared as ObjectMethod', () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        services: {
          service() {}
        }
      })
    `);

    expect(
      result!.machines[0]!.machineCallResult.options?.services?.properties,
    ).toHaveLength(1);

    const node =
      result!.machines[0]!.machineCallResult.options?.services?.properties[0]
        .property;

    expect(t.isObjectMethod(node)).toBeTruthy();
  });

  it('Should extract implementations provided in machine options', () => {
    const result = extractMachinesFromFile(`
      createMachine({}, {
        actions: {
          named: () => {},
          namedAssign: assign({}),
          namedRaise: raise({}),
          namedLog: log(''),
          namedSendTo: sendTo('', ''),
          namedStop: stop('')
        },
        services: {
          'namedCallback': () => () => {}
        },
        actors: {
          'namedPromise': () => Promise.resolve()
        },
        guards: {
          namedGuard: () => {
            return condition()
          }
        },
        delays: {
          namedDelay: () => 2000
        }
      })
    `);

    expect(result!.machines[0]!.getAllMachineOptions()).toMatchInlineSnapshot(`
      {
        "actions": {
          "named": "() => {}",
          "namedAssign": "assign({})",
          "namedLog": "log('')",
          "namedRaise": "raise({})",
          "namedSendTo": "sendTo('', '')",
          "namedStop": "stop('')",
        },
        "actors": {
          "namedCallback": "() => () => {}",
          "namedPromise": "() => Promise.resolve()",
        },
        "delays": {
          "namedDelay": "() => 2000",
        },
        "guards": {
          "namedGuard": "() => {
                  return condition()
                }",
        },
      }
    `);
  });
});
