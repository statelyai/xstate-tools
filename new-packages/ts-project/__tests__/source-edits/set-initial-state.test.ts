import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test("should override root's existing initial state", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'set_initial_state',
      path: [],
      initialState: 'bar',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "bar",
      states: {
        foo: {},
        bar: {},
      },
    });",
    }
  `,
  );
});

test("should override nested state's existing initial state", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo",
        states: {
          foo: {
            initial: "bar",
            states: {
              bar: {},
              baz: {},
            },
          },
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'set_initial_state',
      path: ['foo'],
      initialState: 'baz',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          initial: "baz",
          states: {
            bar: {},
            baz: {},
          },
        },
      },
    });",
    }
  `,
  );
});

test.todo('should add initial state to root', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {},
          bar: {},
        },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'set_initial_state',
      path: [],
      initialState: 'bar',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot();
});
