import { expect, test } from 'vitest';
import { createTestProject, replaceUniqueIds, testdir, ts } from './utils';

test('should extract guard from transition (string)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                guard: "condition",
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "condition",
                },
                "sourceId": "condition",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "condition": {
                  "id": "condition",
                  "name": "condition",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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

test('should extract guard (inline)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                guard: () => true,
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "inline:guard-0",
                },
                "sourceId": "inline:guard-0",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "inline:guard-0": {
                  "id": "inline:guard-0",
                  "name": "inline:guard-0",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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

test('should extract parameterized guards', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                guard: {
                  type: "condition",
                },
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "condition",
                },
                "sourceId": "condition",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "condition": {
                  "id": "condition",
                  "name": "condition",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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

test('should extract higher order guards as inline', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine, and } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                cond: and(["condition1", "condition2"]),
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "inline:guard-0",
                },
                "sourceId": "inline:guard-0",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "inline:guard-0": {
                  "id": "inline:guard-0",
                  "name": "inline:guard-0",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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

test('should extract multiple guards', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV1: {
                target: "bar",
                guard: "condition1",
              },
            },
          },
          bar: {
            on: {
              EV1: {
                target: "baz",
                guard: "condition2",
              },
            },
          },
          baz: {
            on: {
              EV2: {
                target: "foo",
                guard: "condition3",
              },
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "condition1",
                },
                "sourceId": "condition1",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "guard",
                "parentId": "edge-1",
                "properties": {
                  "params": {},
                  "type": "condition2",
                },
                "sourceId": "condition2",
                "uniqueId": "block-1",
              },
              "block-2": {
                "blockType": "guard",
                "parentId": "edge-2",
                "properties": {
                  "params": {},
                  "type": "condition3",
                },
                "sourceId": "condition3",
                "uniqueId": "block-2",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV1",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
              "edge-1": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV1",
                    "type": "named",
                  },
                  "guard": "block-1",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-2",
                "targets": [
                  "state-3",
                ],
                "type": "edge",
                "uniqueId": "edge-1",
              },
              "edge-2": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV2",
                    "type": "named",
                  },
                  "guard": "block-2",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-3",
                "targets": [
                  "state-1",
                ],
                "type": "edge",
                "uniqueId": "edge-2",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "condition1": {
                  "id": "condition1",
                  "name": "condition1",
                  "type": "guard",
                },
                "condition2": {
                  "id": "condition2",
                  "name": "condition2",
                  "type": "guard",
                },
                "condition3": {
                  "id": "condition3",
                  "name": "condition3",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-2",
              },
              "state-3": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "baz",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-3",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should support XState v4 guard', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                cond: "condition",
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "condition",
                },
                "sourceId": "condition",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "condition": {
                  "id": "condition",
                  "name": "condition",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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

test('should raise error if both guard and cond are provided, pick guard over cond and extract transition (cond before guard)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                cond: "condition1",
                guard: "condition2",
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "condition2",
                },
                "sourceId": "condition2",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "condition2": {
                  "id": "condition2",
                  "name": "condition2",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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
          [
            {
              "type": "property_mixed",
            },
          ],
        ],
      ]
    `);
});

test('should raise error if both guard and cond are provided, pick guard over cond and extract transition (guard before cond)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                guard: "condition1",
                cond: "condition2",
              },
            },
          },
          bar: {},
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
                "blockType": "guard",
                "parentId": "edge-0",
                "properties": {
                  "params": {},
                  "type": "condition1",
                },
                "sourceId": "condition1",
                "uniqueId": "block-0",
              },
            },
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": "block-0",
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
            "implementations": {
              "actions": {},
              "actors": {},
              "guards": {
                "condition1": {
                  "id": "condition1",
                  "name": "condition1",
                  "type": "guard",
                },
              },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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
          [
            {
              "type": "property_mixed",
            },
          ],
        ],
      ]
    `);
});

test('should raise error for parameterized guard is missing type property', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                guard: {},
              },
            },
          },
          bar: {},
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
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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
          [
            {
              "type": "transition_property_unhandled",
            },
          ],
        ],
      ]
    `);
});

test('should raise error for parameterized guard with invalid type property', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              EV: {
                target: "bar",
                guard: {
                  type: {},
                },
              },
            },
          },
          bar: {},
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
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "eventType": "EV",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-2",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
            },
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
                  "key": "(machine)",
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
                  "key": "foo",
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
                  "invoke": [],
                  "key": "bar",
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
          [
            {
              "type": "transition_property_unhandled",
            },
          ],
        ],
      ]
    `);
});
