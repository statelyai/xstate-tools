import { expect, test } from 'vitest';
import { createTestProject, replaceUniqueIds, testdir, ts } from './utils';

test('should extract a string entry action (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: "callDavid",
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "undefined": {
                  "id": "callDavid",
                  "name": "callDavid",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract a string exit action (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: "callDavid",
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "undefined": {
                  "id": "callDavid",
                  "name": "callDavid",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract a string action (in array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["callAnders"],
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callAnders",
                },
                "sourceId": "callAnders",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "undefined": {
                  "id": "callAnders",
                  "name": "callAnders",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract multiple string actions', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["callDavid", "callAnders"],
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callAnders",
                },
                "sourceId": "callAnders",
                "uniqueId": "block-1",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "undefined": {
                  "id": "callAnders",
                  "name": "callAnders",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                    "block-1",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract a simple parameterized action (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: {
          type: "callDavid",
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "undefined": {
                  "id": "callDavid",
                  "name": "callDavid",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract a simple parameterized action (in array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: [
          {
            type: "callDavid",
          },
        ],
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "undefined": {
                  "id": "callDavid",
                  "name": "callDavid",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract an inline action (function)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: () => {},
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "inline:action-0",
                },
                "sourceId": "inline:action-0",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "inline:action-0": {
                  "id": "inline:action-0",
                  "name": "inline:action-0",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should extract an inline action (builtin)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: assign({
          count: 0,
        }),
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
                "blockType": "action",
                "parentId": "state-0",
                "properties": {
                  "params": {},
                  "type": "inline:action-0",
                },
                "sourceId": "inline:action-0",
                "uniqueId": "block-0",
              },
            },
            "edges": {},
            "implementations": {
              "actions": {
                "inline:action-0": {
                  "id": "inline:action-0",
                  "name": "inline:action-0",
                  "type": "action",
                },
              },
              "actors": {},
              "guards": {},
            },
            "nodes": {
              "state-0": {
                "data": {
                  "description": undefined,
                  "entry": [
                    "block-0",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
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

test('should error when extracting undefined action (direct)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: undefined,
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
                  "initial": undefined,
                  "invoke": [],
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
          [
            {
              "type": "state_property_unhandled",
            },
          ],
        ],
      ]
    `);
});

test('should error when extracting undefined action (in array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["callDavid", undefined],
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
                  "initial": undefined,
                  "invoke": [],
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
          [
            {
              "type": "state_property_unhandled",
            },
          ],
        ],
      ]
    `);
});
