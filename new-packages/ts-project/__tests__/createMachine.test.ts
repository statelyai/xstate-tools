import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from './utils';

test('should extract createMachine with no arguments', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine();
    `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": undefined,
          "states": [],
        },
        [],
      ],
    ]
  `);
});

test('should extract createMachine empty config', async () => {
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
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});
