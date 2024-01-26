import { expect, test } from 'vitest';
import { createTestProject, replaceUniqueIds, testdir, ts } from './utils';

test('should extract a simple state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {},
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract states recursively', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            states: {
              bar: {
                states: {
                  baz: {},
                },
              },
            },
          },
          state4: {},
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
                  "key": "state4",
                  "metaEntries": [],
                  "tags": [],
                  "type": "normal",
                },
                "parentId": "state-0",
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

test('should extract state.initial with string value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract state.initial with template literal value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: \`foo\`,
        states: {
          foo: {},
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract state.initial with undefined value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: undefined,
        states: {},
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

test('should raise error when state.initial property has invalid value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: {},
        states: {},
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

test('should extract state.type with value "parallel"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: "parallel",
        states: {},
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract state.type with value "final"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: "final",
        states: {},
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
                  "metaEntries": [],
                  "tags": [],
                  "type": "final",
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

test('should extract state.type with value "history"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: "history",
        states: {},
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
                  "initial": undefined,
                  "invoke": [],
                  "key": "(machine)",
                  "metaEntries": [],
                  "tags": [],
                  "type": "history",
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

test('should extract state.type with value undefined', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: undefined,
        states: {},
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

test('should raise error when state.type has invalid value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: 123,
        states: {},
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

test('should extract state.history with value "shallow"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        history: "shallow",
        states: {},
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
                  "history": "shallow",
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

test('should extract state.history with value "deep"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        history: "deep",
        states: {},
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
                  "history": "deep",
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

test('should extract state.history with value true as deep', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        history: true,
        states: {},
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
                  "history": "deep",
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

test('should extract state.history with value false as shallow', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        history: false,
        states: {},
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
                  "history": "shallow",
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

test('should extract state.history with value undefined', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        history: undefined,
        states: {},
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

test('should extract state.description with string value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            description: 'This is the description of state foo'
          }
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
                  "description": "This is the description of state foo",
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract state.description with template literal value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            description: \`This is the description
            of state
            foo\`
          }
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
                  "description": "This is the description
            of state
            foo",
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should extract state.description with undefined value with no errors', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            description: undefined
          }
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

test('should raise error when state.description has invalid value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            description: {}
          }
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

test("should extract state.meta when it's a javascript object", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            meta: {
              str: 'some string',
              num: 123,
              bool: true,
              arr: [1, 2, 3],
              obj: {
                foo: 'bar'
              },
              null: null
            }
          }
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

test("should extract state.meta when it's a javascript object containing nested array items", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            meta: {
              arr: ['str', 123, true, [1, 2, 3], { foo: 'bar' }, null]
            }
          }
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

test("should extract state.meta when it's a javascript object and contains multi level object value", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            meta: {
              obj: {
                x: {
                  y: {
                    z: 'some string'
                  }
                }
              }
            }
          }
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

test('should not raise error for state.meta with undefined value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            meta: undefined
          }
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
            },
            "root": "state-0",
          },
          [],
        ],
      ]
    `);
});

// TODO: this needs to change as technically any value is accepted by XState. Studio only supports plain js objects right now
test('should raise error when state.meta contains any value other than a plain javascript object', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: 'foo'
        states: {
          foo: {
            meta: 'some string meta'
          }
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

test('should extract state.context on the root state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        context: {
          foo: 'bar'
        }
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
              "context": {
                "foo": "bar",
              },
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
          [],
        ],
      ]
    `);
});

test('should raise error when state.context is provided on any state other than the root state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            context: {
              foo: 'bar'
            }
          }
        }
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
            },
            "root": "state-0",
          },
          [
            {
              "type": "state_property_invalid",
            },
          ],
        ],
      ]
    `);
});

test('should raise error when state.context has any value other than plain JS object', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
            context: {
              foo: 'bar'
            }
          }
        }
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
            },
            "root": "state-0",
          },
          [
            {
              "type": "state_property_invalid",
            },
          ],
        ],
      ]
    `);
});

test('should extract state.context with function value (lazy context)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        context: () => {
          return {
            foo: 'bar'
          }
        }
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
              "context": "{{() => {
          return {
            foo: 'bar'
          }
        }}}",
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
          [],
        ],
      ]
    `);
});
