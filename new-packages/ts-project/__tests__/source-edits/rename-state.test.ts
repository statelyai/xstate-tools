import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should rename an identifier state key to another identifier state key', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: "parallel",
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
      type: 'rename_state',
      path: ['foo'],
      name: 'NEW_NAME',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        "NEW_NAME": {},
        bar: {},
      },
    });",
    }
  `,
  );
});
