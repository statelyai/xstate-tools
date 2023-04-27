import outdent from 'outdent';
import ts from 'typescript';
import { parse } from '../test-utils';
import { machineToCreateMachine } from './machine-to-create-machine';

const printer = ts.createPrinter({
  newLine: ts.NewLineKind.LineFeed,
  removeComments: false,
  omitTrailingSemicolon: true,
});

describe('changed', () => {
  test.each<[input: string, expected: string]>([
    [
      `import { Machine } from 'xstate'`,
      `import { createMachine } from 'xstate';`,
    ],
    [
      `import { Machine as M } from 'xstate'`,
      `import { createMachine as M } from 'xstate';`,
    ],
    [
      outdent`
        import { Machine } from 'xstate'
        const machine = Machine({})
      `,
      outdent`
        import { createMachine } from 'xstate';
        const machine = createMachine({});
      `,
    ],
    [
      outdent`
        import { Machine as M } from 'xstate'
        const machine = M({})
      `,
      outdent`
        import { createMachine as M } from 'xstate';
        const machine = M({});
      `,
    ],
    [
      outdent`
        import xstate from 'xstate'
        const machine = xstate.Machine({})
      `,
      outdent`
        import xstate from 'xstate';
        const machine = xstate.createMachine({});
      `,
    ],
    [
      outdent`
        import xstate from 'xstate'
        const Machine = xstate.Machine
      `,
      outdent`
        import xstate from 'xstate';
        const Machine = xstate.createMachine;
      `,
    ],
  ])('%s -> %s', (input, expected) => {
    const {
      transformed: [output],
    } = ts.transform(parse(input), [machineToCreateMachine]);

    expect(printer.printFile(output!)).toBe(`${expected}\n`);
  });
});

describe('unchanged', () => {
  test.each<string>([
    `import { NotMachine } from 'xstate'`,
    `import xstate from 'xstate'`,
    `import { Machine } from 'not-xstate'`,
  ])('%s', (input) => {
    const {
      transformed: [output],
    } = ts.transform(parse(input), [machineToCreateMachine]);

    expect(printer.printFile(output!)).toBe(`${input};\n`);
  });
});
