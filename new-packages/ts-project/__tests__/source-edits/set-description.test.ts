import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to add a description to the root', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({});
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'set_description',
      statePath: [],
      description: 'Wow, so much wow',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	description: "Wow, so much wow"
    });",
    }
  `);
});

test('should be possible to add a description to a nested state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {},
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
      type: 'set_description',
      statePath: ['a'],
      description: 'Wow, so much wow',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          description: "Wow, so much wow"
        },
      },
    });",
    }
  `);
});

test('should be possible to update a description at the root', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        description: "really dull description",
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
      type: 'set_description',
      statePath: [],
      description: 'Wow, so much wow',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      description: "Wow, so much wow",
    });",
    }
  `);
});

test('should be possible to remove a description at the root', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        description: "really dull description",
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
      type: 'set_description',
      statePath: [],
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    });",
    }
  `);
});

test('should be possible to add a multiline description', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({});
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'set_description',
      statePath: [],
      description: `wow\nso much\nwow`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	description: \`wow
    	so much
    	wow\`
    });",
    }
  `);
});
