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

test('should extract createMachine with empty config', async () => {
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

test('should extract multiple createMachines in a single file', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        id: "machine1",
      });

      createMachine({
        id: "machine2",
      });
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
