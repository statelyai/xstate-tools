import * as t from '@babel/types';
import { extractMachinesFromFile } from '..';

describe('Options', () => {
  it('Should extract object methods and functions declared as object methods', () => {
    const result = extractMachinesFromFile(`
      const machine = createMachine({}, {
        actions: {
          setContext(ctx, { evt }, ...args) {
            Object.assign(ctx, evt.context);
          },
          saveUser: assign(({ctx, evt}, params) => {}),
          sendAnalytics: ({ctx, evt}, params) => {}
        }
      })
    `);

    expect(result?.machines[0]?.getAllMachineImplementations())
      .toMatchInlineSnapshot(`
      {
        "actions": {
          "saveUser": "assign(({ctx, evt}, params) => {})",
          "sendAnalytics": "({ctx, evt}, params) => {}",
          "setContext": "function setContext(ctx, { evt }, ...args){
                  Object.assign(ctx, evt.context);
                }",
        },
        "actors": {},
        "delays": {},
        "guards": {},
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
