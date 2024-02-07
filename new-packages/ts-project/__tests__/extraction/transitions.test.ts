import { expect, test } from 'vitest';
import { createTestProject, replaceUniqueIds, testdir, ts } from '../utils';

test('should extract transition to a sibling (direct string)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              FOO: "bar",
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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

test('should extract transition to a sibling (string in array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              FOO: ["bar"],
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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

test('should extract transition to a sibling (direct object with target)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              FOO: { target: "bar" },
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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

test('should extract transition to a sibling (object with target in array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              FOO: [{ target: "bar" }],
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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

test('should extract transition to a child', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              FOO: ".bar",
            },
            states: {
              bar: {},
            },
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
                    "eventType": "FOO",
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
                "parentId": "state-1",
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

test('should extract transition to an ID', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              FOO: "#thing",
            },
          },
          bar: {
            id: "thing",
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
                    "eventType": "FOO",
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

test('should extract multiple transitions (array of strings)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              EV: ["bar", "baz"],
            },
          },
          bar: {},
          baz: {},
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
              "edge-1": {
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
                  "state-3",
                ],
                "type": "edge",
                "uniqueId": "edge-1",
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

test('should extract multiple transitions (array of objects)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              EV: [{ target: "bar" }, { target: "baz" }],
            },
          },
          bar: {},
          baz: {},
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
              "edge-1": {
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
                  "state-3",
                ],
                "type": "edge",
                "uniqueId": "edge-1",
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

test('should extract multiple transitions (mixed array)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            on: {
              EV: [{ target: "bar" }, "baz"],
            },
          },
          bar: {},
          baz: {},
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
              "edge-1": {
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
                  "state-3",
                ],
                "type": "edge",
                "uniqueId": "edge-1",
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

test('should extract transition with multiple targets (array of strings)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          MULTIPLE: {
            target: [".a.a2", ".b.b2"],
          },
        },
        type: "parallel",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
              a2: {},
            },
          },
          b: {
            initial: "b1",
            states: {
              b1: {},
              b2: {},
            },
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
                    "eventType": "MULTIPLE",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-0",
                "targets": [
                  "state-3",
                  "state-6",
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
                  "metaEntries": [],
                  "tags": [],
                  "type": "parallel",
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
                  "initial": "a1",
                  "invoke": [],
                  "key": "a",
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
                  "key": "a1",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
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
                  "key": "a2",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
                "type": "node",
                "uniqueId": "state-3",
              },
              "state-4": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "b1",
                  "invoke": [],
                  "key": "b",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-4",
              },
              "state-5": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "b1",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-4",
                "type": "node",
                "uniqueId": "state-5",
              },
              "state-6": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "b2",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-4",
                "type": "node",
                "uniqueId": "state-6",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract forbidden transition (undefined)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: undefined,
            },
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [],
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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

test('should extract forbidden transition (null)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: null,
            },
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [],
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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

test('should extract deep sibling transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: "b.deep.child",
            },
          },
          b: {
            states: {
              deep: {
                states: {
                  child: {},
                },
              },
            },
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-4",
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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
                  "key": "b",
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
                  "key": "deep",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-2",
                "type": "node",
                "uniqueId": "state-3",
              },
              "state-4": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "child",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-3",
                "type": "node",
                "uniqueId": "state-4",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract deep descendant transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: ".deep.child",
            },
            states: {
              deep: {
                states: {
                  child: {},
                },
              },
            },
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-3",
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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
                  "key": "deep",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
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
                  "key": "child",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-2",
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

test('should extract transition to a deep child of an ID target', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: "#test.deep.child",
            },
          },
          b: {
            id: "test",
            states: {
              deep: {
                states: {
                  child: {},
                },
              },
            },
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-4",
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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
                  "key": "b",
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
                  "key": "deep",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-2",
                "type": "node",
                "uniqueId": "state-3",
              },
              "state-4": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "child",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-3",
                "type": "node",
                "uniqueId": "state-4",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract a wildcard transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              "*": "b",
            },
          },
          b: {},
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
                    "type": "wildcard",
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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
                  "key": "b",
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

test('should extract transition description (single-line)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: {
                description: "test",
                target: undefined,
              },
            },
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
            "blocks": {},
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": "test",
                  "eventTypeData": {
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [],
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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

test('should extract an always transition (direct string)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            always: "b",
          },
          b: {},
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
                    "type": "always",
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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
                  "key": "b",
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

test('should extract invoke.onDone transition (with invoke.id)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            invoke: {
              src: "callDavid",
              id: "urgentCall",
              onDone: "relief",
            },
          },
          relief: {},
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
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "urgentCall",
                  "src": "callDavid",
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
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "invocationId": "block-0",
                    "type": "invocation.done",
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
              "actors": {
                "callDavid": {
                  "id": "callDavid",
                  "name": "callDavid",
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
                  "invoke": [
                    "block-0",
                  ],
                  "key": "a",
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
                  "key": "relief",
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

test('should extract invoke.onDone transition (without invoke.id)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            invoke: {
              src: "callDavid",
              onDone: "shipIt",
            },
          },
          shipIt: {},
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
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "callDavid",
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
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "invocationId": "block-0",
                    "type": "invocation.done",
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
              "actors": {
                "callDavid": {
                  "id": "callDavid",
                  "name": "callDavid",
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
                  "invoke": [
                    "block-0",
                  ],
                  "key": "a",
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
                  "key": "shipIt",
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

test('should extract invoke.onDone action', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            invoke: {
              src: "callDavid",
              onDone: {
                target: "shipIt",
                actions: "holdBreath",
              },
            },
          },
          shipIt: {},
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
                  "type": "holdBreath",
                },
                "sourceId": "holdBreath",
                "uniqueId": "block-0",
              },
              "block-1": {
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "callDavid",
                },
                "sourceId": "callDavid",
                "uniqueId": "block-1",
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
                    "invocationId": "block-1",
                    "type": "invocation.done",
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
              "actions": {
                "holdBreath": {
                  "id": "holdBreath",
                  "name": "holdBreath",
                  "type": "action",
                },
              },
              "actors": {
                "callDavid": {
                  "id": "callDavid",
                  "name": "callDavid",
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
                  "invoke": [
                    "block-1",
                  ],
                  "key": "a",
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
                  "key": "shipIt",
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

test('should extract invoke.onError transition (with invoke.id)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            invoke: {
              src: "callDavid",
              id: "urgentCall",
              onError: "panic",
            },
          },
          panic: {},
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
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "urgentCall",
                  "src": "callDavid",
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
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "invocationId": "block-0",
                    "type": "invocation.error",
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
              "actors": {
                "callDavid": {
                  "id": "callDavid",
                  "name": "callDavid",
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
                  "invoke": [
                    "block-0",
                  ],
                  "key": "a",
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
                  "key": "panic",
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

test('should extract invoke.onError transition (without invoke.id)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            invoke: {
              src: "callDavid",
              onError: "revert",
            },
          },
          revert: {},
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
                "blockType": "actor",
                "parentId": "state-1",
                "properties": {
                  "id": "inline:actor-id-0",
                  "src": "callDavid",
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
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "invocationId": "block-0",
                    "type": "invocation.error",
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
              "actors": {
                "callDavid": {
                  "id": "callDavid",
                  "name": "callDavid",
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
                  "invoke": [
                    "block-0",
                  ],
                  "key": "a",
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
                  "key": "revert",
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

test('should extract transition description (multi-line)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    // it doesn't properly escape backticks when inserting into the template literal
    // eslint-disable-next-line @preconstruct/format-js-tag/format
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              EVENT: {
                description: \`wow
                            much
                            awesome\`,
                target: undefined,
              },
            },
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
            "blocks": {},
            "data": {
              "context": {},
            },
            "edges": {
              "edge-0": {
                "data": {
                  "actions": [],
                  "description": "wow
                            much
                            awesome",
                  "eventTypeData": {
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [],
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
              "state-1": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "a",
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

test('should extract state.onDone transition (direct string)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            onDone: "bar",
          },
          bar: {},
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
                    "type": "state.done",
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
          [],
        ],
      ]
    `);
});

test("should extract transition.meta when it's a javascript object", async () => {
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
                meta: {
                  str: "some string",
                  num: 123,
                  bool: true,
                  arr: [1, 2, 3],
                  obj: {
                    foo: "bar",
                  },
                  null: null,
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

  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                  "metaEntries": [
                    [
                      "str",
                      "some string",
                    ],
                    [
                      "num",
                      123,
                    ],
                    [
                      "bool",
                      true,
                    ],
                    [
                      "arr",
                      [
                        1,
                        2,
                        3,
                      ],
                    ],
                    [
                      "obj",
                      {
                        "foo": "bar",
                      },
                    ],
                    [
                      "null",
                      null,
                    ],
                  ],
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
          [],
        ],
      ]
    `);
});

test("should extract transition.meta when it's a javascript object containing nested array items", async () => {
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
                meta: {
                  arr: ["str", 123, true, [1, 2, 3], { foo: "bar" }, null],
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

  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                  "metaEntries": [
                    [
                      "arr",
                      [
                        "str",
                        123,
                        true,
                        [
                          1,
                          2,
                          3,
                        ],
                        {
                          "foo": "bar",
                        },
                        null,
                      ],
                    ],
                  ],
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
          [],
        ],
      ]
    `);
});

test("should extract transition.meta when it's a javascript object and contains multi level object value", async () => {
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
                meta: {
                  obj: {
                    x: {
                      y: {
                        z: "some string",
                      },
                    },
                  },
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

  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                  "metaEntries": [
                    [
                      "obj",
                      {
                        "x": {
                          "y": {
                            "z": "some string",
                          },
                        },
                      },
                    ],
                  ],
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
          [],
        ],
      ]
    `);
});

test('should not raise error for transition.meta with undefined value', async () => {
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
                meta: undefined,
              },
            },
          },
          bar: {},
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
          [],
        ],
      ]
    `);
});

// TODO: this needs to change as technically any value is accepted by XState. Studio only supports plain js objects right now
test('should raise error when transition.meta contains any value other than a plain javascript object', async () => {
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
                meta: "some string meta",
              },
            },
          },
          bar: {},
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
              "type": "property_unhandled",
            },
          ],
        ],
      ]
    `);
});

test('should extract after transition (number delay)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            after: {
              100: "bar",
            },
          },
          bar: {},
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
                    "delay": "100",
                    "type": "after",
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
          [],
        ],
      ]
    `);
});

test('should extract delayed transition (identifier delay)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            after: {
              myDelay: "bar",
            },
          },
          bar: {},
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
                    "delay": "myDelay",
                    "type": "after",
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
          [],
        ],
      ]
    `);
});

test('should extract after transition (string with whitespace delay)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            after: {
              "my delay": "bar",
            },
          },
          bar: {},
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
                    "delay": "my delay",
                    "type": "after",
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
          [],
        ],
      ]
    `);
});

test('should extract multiple delayed transitions', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            after: {
              100: { guard: "condition", target: "bar" },
              200: "baz",
            },
          },
          bar: {},
          baz: {},
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
                "blockType": "guard",
                "parentId": "edge-1",
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
                    "delay": "200",
                    "type": "after",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-1",
                "targets": [
                  "state-3",
                ],
                "type": "edge",
                "uniqueId": "edge-0",
              },
              "edge-1": {
                "data": {
                  "actions": [],
                  "description": undefined,
                  "eventTypeData": {
                    "delay": "100",
                    "type": "after",
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
                "uniqueId": "edge-1",
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

test('should extract a sibling transition as internal by default (direct string)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: "bar",
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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
          [],
        ],
      ]
    `);
});

test('should extract a descendant transition as internal by default (direct string)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: ".bar",
            },
            states: {
              bar: {},
            },
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
                    "eventType": "FOO",
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
                "parentId": "state-1",
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

test('should extract a sibling transition as internal by default (direct object with target)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: { target: "bar" },
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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
          [],
        ],
      ]
    `);
});

test('should extract a descendant transition as internal by default (direct object with target)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: {
                target: ".bar",
              },
            },
            states: {
              bar: {},
            },
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
                    "eventType": "FOO",
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
                "parentId": "state-1",
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

test('should extract an explicit reentering transition as not internal', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: { target: "bar", reenter: true },
            },
          },
          bar: {},
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": false,
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
          [],
        ],
      ]
    `);
});

test('should extract an explicit non-reentering transition as internal', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: { target: "bar", reenter: false },
            },
          },
          bar: {},
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
                    "eventType": "FOO",
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
          [],
        ],
      ]
    `);
});

test('should extract a sibling transition as not internal by default (direct string, v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: "bar",
            },
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": false,
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
          [],
        ],
      ]
    `);
});

test('should extract a descendant transition as internal by default (direct string, v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: ".bar",
            },
            states: {
              bar: {},
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "FOO",
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
                "parentId": "state-1",
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

test('should extract a sibling transition as internal by default (direct object with target, v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: { target: "bar" },
            },
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": false,
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
          [],
        ],
      ]
    `);
});

test('should extract a descendant transition as internal by default (direct object with target, v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: {
                target: ".bar",
              },
            },
            states: {
              bar: {},
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "FOO",
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
                "parentId": "state-1",
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

test('should extract an explicit internal transition as internal (v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: { target: "bar", internal: true },
            },
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "FOO",
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
          [],
        ],
      ]
    `);
});

test('should extract an explicit non-internal transition as not internal (v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            on: {
              FOO: { target: "bar", internal: false },
            },
          },
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": false,
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
          [],
        ],
      ]
    `);
});

test('should extract transition with multiple targets as internal when any of its targets is defined using a descendant target by default (array of strings, v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          MULTIPLE: {
            target: [".a.a2", "#two"],
          },
        },
        type: "parallel",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
              a2: {},
            },
          },
          b: {
            initial: "b1",
            states: {
              b1: {},
              b2: {
                id: "two",
              },
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "MULTIPLE",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
                  "metaEntries": [],
                },
                "source": "state-0",
                "targets": [
                  "state-3",
                  "state-6",
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
                  "metaEntries": [],
                  "tags": [],
                  "type": "parallel",
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
                  "initial": "a1",
                  "invoke": [],
                  "key": "a",
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
                  "key": "a1",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
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
                  "key": "a2",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
                "type": "node",
                "uniqueId": "state-3",
              },
              "state-4": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "b1",
                  "invoke": [],
                  "key": "b",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-4",
              },
              "state-5": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "b1",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-4",
                "type": "node",
                "uniqueId": "state-5",
              },
              "state-6": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "b2",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-4",
                "type": "node",
                "uniqueId": "state-6",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract transition with multiple targets as not internal when none of its targets is defined using a descendant target by default (array of strings, v4)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          MULTIPLE: {
            target: ["#one", "#two"],
          },
        },
        type: "parallel",
        states: {
          a: {
            initial: "a1",
            states: {
              a1: {},
              a2: {
                id: "one",
              },
            },
          },
          b: {
            initial: "b1",
            states: {
              b1: {},
              b2: {
                id: "two",
              },
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath, { xstateVersion: '4' });
  expect(replaceUniqueIds(project.getMachinesInFile('index.ts')))
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
                    "eventType": "MULTIPLE",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": false,
                  "metaEntries": [],
                },
                "source": "state-0",
                "targets": [
                  "state-3",
                  "state-6",
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
                  "metaEntries": [],
                  "tags": [],
                  "type": "parallel",
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
                  "initial": "a1",
                  "invoke": [],
                  "key": "a",
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
                  "key": "a1",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
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
                  "key": "a2",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-1",
                "type": "node",
                "uniqueId": "state-3",
              },
              "state-4": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": "b1",
                  "invoke": [],
                  "key": "b",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
                "type": "node",
                "uniqueId": "state-4",
              },
              "state-5": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "b1",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-4",
                "type": "node",
                "uniqueId": "state-5",
              },
              "state-6": {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "b2",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-4",
                "type": "node",
                "uniqueId": "state-6",
              },
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});