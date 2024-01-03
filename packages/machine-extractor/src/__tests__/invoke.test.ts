import { extractMachinesFromFile } from '../extractMachinesFromFile';
import { hashedId } from '../utils';

describe('Invoke', () => {
  it('Should allow for JSON stringifying anonymous invocations', () => {
    const id = hashedId('() => {}');
    const result = extractMachinesFromFile(`
      createMachine({
        invoke: {
          src: "${id}",
        }
      })
    `);

    const config = JSON.stringify(result!.machines[0]!.toConfig());

    expect(config).toContain(id);
  });

  it('Should detect inline implementations correctly', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        invoke: {
          src: () => {},
        }
      })
    `);

    const invoke =
      result!.machines[0]!.machineCallResult.definition?.invoke?.[0];

    expect(invoke?.src?.declarationType).toEqual('inline');

    const invokes = result!.machines[0]!.getAllServices(['inline']);

    expect(invokes).toHaveLength(1);
  });

  it('Should extract inline actors correctly', () => {
    const result = extractMachinesFromFile(`
      createMachine({
        invoke: [
          {src: 'string source'},
          {src: () => {
            console.log('inline function')
          }},
          {src: () => () => {
            console.log('callback actor')
          }},
          {src: fromPromise(() => {
            return fetch('https://example.com/...').then((data) => data.json());
          })},
          {src: identifierActor},
        ]
      })
    `);
    const invoke = result!.machines[0]!.toConfig()?.invoke;

    expect(invoke).toMatchInlineSnapshot(`
      [
        {
          "kind": "named",
          "src": "string source",
        },
        {
          "kind": "inline",
          "src": "() => {
                  console.log('inline function')
                }",
        },
        {
          "kind": "inline",
          "src": "() => () => {
                  console.log('callback actor')
                }",
        },
        {
          "kind": "inline",
          "src": "fromPromise(() => {
                  return fetch('https://example.com/...').then((data) => data.json());
                })",
        },
        {
          "kind": "inline",
          "src": "identifierActor",
        },
      ]
    `);
  });
});
