import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Options', () => {
  it("Should extract machine implementation when it's object method", () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actions: {
          setContext(context, { data }, ...args) {
            
          }
        }
      })
    `);

    expect(result?.machines[0]?.getAllMachineImplementations().actions)
      .toMatchInlineSnapshot(`
      {
        "setContext": "function setContext(context, { data }, ...args){
                  
                }",
      }
    `);
  });
  it("Should extract machine implementation when it's object method with invalid identifier as anonymous function declaration", () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actions: {
          "fetch user"(context, { data }, ...args) {},
          "fetch user2": (context, {data}, ...args) => {}
        }
      })
    `);

    expect(result?.machines[0]?.getAllMachineImplementations().actions)
      .toMatchInlineSnapshot(`
      {
        "fetch user": "function (context, { data }, ...args){}",
        "fetch user2": "(context, {data}, ...args) => {}",
      }
    `);
  });
  it("Should extract machine implementations when it's object property", () => {
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
  it("Should extract machine implementations when it's object property with invalid identifier as-is", () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actions: {
          "save user": assign((context, event) => {}),
          "save user2": (context, event) => {}
        }
      })
    `);

    expect(result?.machines[0]?.getAllMachineImplementations().actions)
      .toMatchInlineSnapshot(`
      {
        "save user": "assign((context, event) => {})",
        "save user2": "(context, event) => {}",
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
