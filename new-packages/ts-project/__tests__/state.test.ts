import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from './utils';

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
  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
            ".foo": {
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
              "parentId": "",
              "type": "node",
              "uniqueId": ".foo",
            },
          },
          "root": "",
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
          state1: {
            states: {
              state2: {
                states: {
                  state3: {},
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
  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
            ".state1": {
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
              "parentId": "",
              "type": "node",
              "uniqueId": ".state1",
            },
            ".state1.state2": {
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
              "parentId": ".state1",
              "type": "node",
              "uniqueId": ".state1.state2",
            },
            ".state1.state2.state3": {
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
              "parentId": ".state1.state2",
              "type": "node",
              "uniqueId": ".state1.state2.state3",
            },
            ".state4": {
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
              "parentId": "",
              "type": "node",
              "uniqueId": ".state4",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
            ".foo": {
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
              "parentId": "",
              "type": "node",
              "uniqueId": ".foo",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
            ".foo": {
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
              "parentId": "",
              "type": "node",
              "uniqueId": ".foo",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": undefined,
                "initial": undefined,
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "final",
              },
              "parentId": undefined,
              "type": "node",
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": undefined,
                "initial": undefined,
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "history",
              },
              "parentId": undefined,
              "type": "node",
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": "shallow",
                "initial": undefined,
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "normal",
              },
              "parentId": undefined,
              "type": "node",
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
              "data": {
                "description": undefined,
                "entry": [],
                "exit": [],
                "history": "deep",
                "initial": undefined,
                "invoke": [],
                "metaEntries": [],
                "tags": [],
                "type": "normal",
              },
              "parentId": undefined,
              "type": "node",
              "uniqueId": "",
            },
          },
          "root": "",
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

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": {},
          "nodes": {
            "": {
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
              "uniqueId": "",
            },
          },
          "root": "",
        },
        [],
      ],
    ]
  `);
});
