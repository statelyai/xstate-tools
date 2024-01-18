import { expect, test } from 'vitest';
import { createTestProject, replaceUniqueIds, testdir, ts } from './utils';

test('should extract an actor with string src (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "foo",
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "actor",
                "parentId": "state-0",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "foo",
                },
                "sourceId": "foo",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {},
              "actors": {
                "foo": {
                  "id": "foo",
                  "name": "foo",
                  "type": "actor",
                },
              },
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-0",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": undefined,
                "type": "node",
                "uniqueId": "state-0",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});
test('should extract multiple actors with different string sources (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {
              src: "actor1",
            },
          },
          bar: {
            invoke: {
              src: "actor2",
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "actor1",
                },
                "sourceId": "actor1",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "actor",
                "parentId": "state-2",
                "properties": {
                  "id": "inline:actor-id-1",
                  "src": "actor2",
                },
                "sourceId": "actor2",
                "uniqueId": "block-1",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {},
              "actors": {
                "actor1": {
                  "id": "actor1",
                  "name": "actor1",
                  "type": "actor",
                },
                "actor2": {
                  "id": "actor2",
                  "name": "actor2",
                  "type": "actor",
                },
              },
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "foo",
                  "invoke": [],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": undefined,
                "type": "node",
                "uniqueId": "state-0",
              },
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-0",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-1",
              },
              "state-2": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-1",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-2",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});
test('should extract multiple actors with the same string source (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {
              src: "actor1",
            },
          },
          bar: {
            invoke: {
              src: "actor1",
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "actor1",
                },
                "sourceId": "actor1",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "actor",
                "parentId": "state-2",
                "properties": {
                  "id": "inline:actor-id-1",
                  "src": "actor1",
                },
                "sourceId": "actor1",
                "uniqueId": "block-1",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {},
              "actors": {
                "actor1": {
                  "id": "actor1",
                  "name": "actor1",
                  "type": "actor",
                },
              },
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "foo",
                  "invoke": [],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": undefined,
                "type": "node",
                "uniqueId": "state-0",
              },
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-0",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-1",
              },
              "state-2": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-1",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-2",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});
test('should extract multiple actors with string source (array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: [
              {
                src: "actor1",
              },
              {
                src: "actor2",
              },
            ],
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "actor1",
                },
                "sourceId": "actor1",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-1",
                  "src": "actor2",
                },
                "sourceId": "actor2",
                "uniqueId": "block-1",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {},
              "actors": {
                "actor1": {
                  "id": "actor1",
                  "name": "actor1",
                  "type": "actor",
                },
                "actor2": {
                  "id": "actor2",
                  "name": "actor2",
                  "type": "actor",
                },
              },
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "foo",
                  "invoke": [],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": undefined,
                "type": "node",
                "uniqueId": "state-0",
              },
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-0",
                    "block-1",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-1",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});
test('should extract actor with inline source (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {
              src: () => {},
            },
          },
          bar: {
            invoke: {
              src: identifier,
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "inline:actor-0",
                },
                "sourceId": "inline:actor-0",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "actor",
                "parentId": "state-2",
                "properties": {
                  "id": "inline:actor-id-1",
                  "src": "inline:actor-1",
                },
                "sourceId": "inline:actor-1",
                "uniqueId": "block-1",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {},
              "actors": {
                "inline:actor-0": {
                  "id": "inline:actor-0",
                  "name": "inline:actor-0",
                  "type": "actor",
                },
                "inline:actor-1": {
                  "id": "inline:actor-1",
                  "name": "inline:actor-1",
                  "type": "actor",
                },
              },
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "foo",
                  "invoke": [],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": undefined,
                "type": "node",
                "uniqueId": "state-0",
              },
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-0",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-1",
              },
              "state-2": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [
                    "block-1",
                  ],
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-2",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});
test('should raise error if actor is missing src property', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {},
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
    [
      [
        {
          "blocks": {},
          "data": {
            "context": {},
          },
          "edges": {},
          "implementations": {
            "actions": {},
            "actors": {},
            "guards": {},
          },
          "nodes": {
            "state-0": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": undefined,
                "initial": "foo",
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "normal",
              },
              "parentId": undefined,
              "type": "node",
              "uniqueId": "state-0",
            },
            "state-1": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": undefined,
                "initial": undefined,
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "normal",
              },
              "parentId": "state-0",
              "type": "node",
              "uniqueId": "state-1",
            },
          },
          "root": "state-0",
        },
        [
          {
            "type": "state_property_unhandled",
          },
        ],
      ],
    ]
  `);
});
test('should extract actor id if it is present with a string value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            invoke: {
              src: "actor1",
              id: "user-provided-id",
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.extractMachines('index.ts')))
    .toMatchInlineSnapshot(`
    [
      [
        {
          "blocks": {
            "block-0": {
              "blockType": "actor",
              "parentId": "state-1",
              "properties": {
                "id": "user-provided-id",
                "src": "actor1",
              },
              "sourceId": "actor1",
              "uniqueId": "block-0",
            },
          },
          "data": {
            "context": {},
          },
          "edges": {},
          "implementations": {
            "actions": {},
            "actors": {
              "actor1": {
                "id": "actor1",
                "name": "actor1",
                "type": "actor",
              },
            },
            "guards": {},
          },
          "nodes": {
            "state-0": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": undefined,
                "initial": "foo",
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "normal",
              },
              "parentId": undefined,
              "type": "node",
              "uniqueId": "state-0",
            },
            "state-1": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": undefined,
                "initial": undefined,
                "invoke": [
                  "block-0",
                ],
                "metaEntries": [],
                "tags": [],
                "type": "normal",
              },
              "parentId": "state-0",
              "type": "node",
              "uniqueId": "state-1",
            },
          },
          "root": "state-0",
        },
        [],
      ],
    ]
  `);
});
