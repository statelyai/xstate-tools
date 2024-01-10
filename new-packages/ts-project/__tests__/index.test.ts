import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from './utils';

test('should extract empty config', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({});
    `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {},
        [],
      ],
    ]
  `);
});

test('should extract root state keys', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        foo: {},
        bar: {},
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "bar": {},
          "foo": {},
        },
        [],
      ],
    ]
  `);
});
