import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test(`should be possible to update invoke's source`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "callDavid",
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 0,
      source: 'callAn(d)e(r)s',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: {
        src: "callAn(d)e(r)s",
      },
    });",
    }
  `);
});

test(`should be possible to add an ID to the existing invoke`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "callDavid",
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 0,
      id: 'importantCall',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: {
        src: "callDavid",
        id: "importantCall",
      },
    });",
    }
  `);
});

test(`should be possible to update invoke's ID`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "callDavid",
          id: "importantCall",
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 0,
      id: 'veryImportantCall',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: {
        src: "callDavid",
        id: "veryImportantCall",
      },
    });",
    }
  `);
});

test(`should be possible to update invoke's source and ID at the same time`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "callDavid",
          id: "importantCall",
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 0,
      source: 'callAn(d)e(r)s',
      id: 'veryImportantCall',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: {
        src: "callAn(d)e(r)s",
        id: "veryImportantCall",
      },
    });",
    }
  `);
});

test(`should be possible to remove invoke's ID`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "callDavid",
          id: "importantCall",
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 0,
      id: null,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: {
        src: "callDavid",
      },
    });",
    }
  `);
});

test(`should remove all \`id\` props when removing invoke's ID`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: {
          src: "callDavid",
          id: "importantCall",
          id: "veryImportantCall",
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 0,
      id: null,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: {
        src: "callDavid",
      },
    });",
    }
  `);
});

test(`should be possible to update nth invoke's source`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: [
          {
            src: "callDavid",
          },
          {
            src: "callAnders",
          },
        ],
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
      type: 'edit_invoke',
      path: [],
      invokeIndex: 1,
      source: 'callAn(d)e(r)s',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: [
        {
          src: "callDavid",
        },
        {
          src: "callAn(d)e(r)s",
        },
      ],
    });",
    }
  `);
});
