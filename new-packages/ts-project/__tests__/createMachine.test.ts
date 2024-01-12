import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from './utils';

test('should extract a machine with empty config', async () => {
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

test('should extract a machine created with no config at all', async () => {
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

test('should extract multiple machines in a single file', async () => {
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

test('should extract a machine created with `setup`', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { setup } from "xstate";

      setup({}).createMachine({
        states: {
          foo: {},
        },
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
            "states": [
              {
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
                "id": "foo",
                "states": [],
              },
            ],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});
