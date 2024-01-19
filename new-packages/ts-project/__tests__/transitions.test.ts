import { expect, test } from 'vitest';
import { createTestProject, replaceUniqueIds, testdir, ts } from './utils';

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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "FOO",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
              "state-2": {
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
              "state-2": {
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
              "state-2": {
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
                    "eventType": "MULTIPLE",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                    "type": "wildcard",
                  },
                  "guard": undefined,
                  "internal": true,
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
              "state-2": {
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
                  "description": "test",
                  "eventTypeData": {
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
                  "description": "wow
                            much
                            awesome",
                  "eventTypeData": {
                    "eventType": "EVENT",
                    "type": "named",
                  },
                  "guard": undefined,
                  "internal": true,
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
          [],
        ],
      ]
    `);
});
