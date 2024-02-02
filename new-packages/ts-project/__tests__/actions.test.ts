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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callDavid": {
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callDavid": {
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callAnders": {
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callAnders": {
                  "id": "callAnders",
                  "name": "callAnders",
                  "type": "action",
                },
                "callDavid": {
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
                    "block-1",
                  ],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callDavid": {
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callDavid": {
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
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
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
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
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
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

test('should extract a transition action', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          EV: {
            actions: ["callDavid"],
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "action",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [
                    "block-0",
                  ],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-0",
                "targets": [],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {
                "callDavid": {
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
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
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

test('should not register multiple entry actions with duplicated entry property', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["callDavid"],
        entry: ["callAnders"],
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
            "data": {
              "context": {},
            },
            "edges": {},
            "implementations": {
              "actions": {
                "callAnders": {
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
                  "key": "(machine)",
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

test('should not register multiple transition actions with duplicated actions property', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          EVENT: {
            actions: ["callDavid"],
            actions: ["callAnders"],
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
    .toMatchInlineSnapshot(`
      [
        [
          {
            "blocks": {
              "block-0": {
                "blockType": "action",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "callAnders",
                },
                "sourceId": "callAnders",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [
                    "block-0",
                  ],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-0",
                "targets": [],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {
                "callAnders": {
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
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
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
