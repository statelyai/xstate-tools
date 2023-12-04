import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Options', () => {
  it('Should extract machine options implementations as object methods', () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actions: {
          setContext(context, { event }, ...args) {
            
          },
          "fetch user"(context, { event }, ...args) {}
        }
      })
    `);

    expect(result?.machines[0]?.getAllMachineImplementations().actions)
      .toMatchInlineSnapshot(`
      {
        "fetch user": "(context, { event }, ...args) => {}",
        "setContext": "function setContext(context, { event }, ...args){
                  
                }",
      }
    `);
  });
  it('Should extract machine options implementations as object property', () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actions: {
          saveUser: assign((context, event) => {}),
          sendAnalytics: (context, event) => {}
        }
      })
    `);

    expect(result?.machines[0]?.getAllMachineImplementations().actions)
      .toMatchInlineSnapshot(`
      {
        "saveUser": "assign((context, event) => {})",
        "sendAnalytics": "(context, event) => {}",
      }
    `);
  });

  it('Should include both services and actors in extracted machine options', () => {
    const result = extractMachinesFromFile(`
      createMachine({}, {
        services: {
          'namedCallback': () => () => {}
        },
        actors: {
          'namedPromise': () => Promise.resolve()
        },
      })
    `);

    expect(result!.machines[0]!.getAllMachineImplementations())
      .toMatchInlineSnapshot(`
      {
        "actions": {},
        "actors": {
          "namedCallback": "() => () => {}",
          "namedPromise": "() => Promise.resolve()",
        },
        "delays": {},
        "guards": {},
      }
    `);
  });
});
