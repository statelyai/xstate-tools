import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to update a guard name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            guard: "isItTooLate",
            actions: "callDavid",
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
      type: 'edit_guard',
      path: [],
      transitionPath: ['on', 'CALL_HIM_MAYBE', 0],
      name: 'isHeAwake',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: {
          guard: "isHeAwake",
          actions: "callDavid",
        },
      },
    });",
    }
  `);
});

test('should be possible to update a parametrized guard name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            guard: { type: "isItTooLate", time: "9am" },
            actions: "callDavid",
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
      type: 'edit_guard',
      path: [],
      transitionPath: ['on', 'CALL_HIM_MAYBE', 0],
      name: 'isHeAwake',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: {
          guard: { type: "isHeAwake", time: "9am" },
          actions: "callDavid",
        },
      },
    });",
    }
  `);
});
