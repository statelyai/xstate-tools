import { parseMachinesFromFile } from '../parseMachinesFromFile';
import { hashedId } from '../utils';

describe('Invoke', () => {
  it('Should allow for JSON stringifying anonymous invocations', () => {
    const id = hashedId('() => {}');
    const result = parseMachinesFromFile(`
      createMachine({
        invoke: {
          src: "${id}",
        }
      })
    `);

    const config = JSON.stringify(
      result.machines[0].toConfig({
        hashInlineImplementations: true,
      }),
    );

    expect(config).toContain(id);
  });

  it('Should detect inline implementations correctly', () => {
    const result = parseMachinesFromFile(`
      createMachine({
        invoke: {
          src: () => {},
        }
      })
    `);

    const invoke = result.machines[0].ast.definition?.invoke?.[0];

    expect(invoke?.src?.declarationType).toEqual('inline');

    const invokes = result.machines[0].getAllServices(['inline']);

    expect(invokes).toHaveLength(1);
  });
});
