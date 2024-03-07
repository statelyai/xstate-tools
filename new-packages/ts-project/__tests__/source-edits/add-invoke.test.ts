import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to add an invoke to the root', async () => {
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
      type: 'add_invoke',
      path: [],
      invokeIndex: 0,
      source: 'callDavid',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	invoke: {
    		src: "callDavid"
    	}
    });",
    }
  `);
});

test('should be possible to add an invoke to a nested state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: "a",
        },
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
      type: 'add_invoke',
      path: ['a'],
      invokeIndex: 0,
      source: 'callDavid',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: "a",
      },
      states: {
        a: {
          invoke: {
            src: "callDavid"
          }
        },
      },
    });",
    }
  `);
});

test('should be possible to add an invoke with an ID', async () => {
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
      type: 'add_invoke',
      path: [],
      invokeIndex: 0,
      source: 'callDavid',
      id: 'importantCall',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	invoke: {
    		src: "callDavid",
    		id: "importantCall"
    	}
    });",
    }
  `);
});

test('should be possible to add a new invoke to an existing invoke property', async () => {
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
      type: 'add_invoke',
      path: [],
      invokeIndex: 1,
      source: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: [ {
        src: "callDavid",
      },
      {
      src: "getRaise"
    }
      ],
    });",
    }
  `);
});

test('should be possible to add a new invoke at the start of the existing invoke list', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: [
          {
            src: "miny",
          },
          {
            src: "moe",
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
      type: 'add_invoke',
      path: [],
      invokeIndex: 0,
      source: 'eeny',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: [
        {
      src: "eeny"
    },
        {
          src: "miny",
        },
        {
          src: "moe",
        },
      ],
    });",
    }
  `);
});

test('should be possible to add a new invoke in the middle of the existing invoke list', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: [
          {
            src: "eeny",
          },
          {
            src: "moe",
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
      type: 'add_invoke',
      path: [],
      invokeIndex: 1,
      source: 'miny',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: [
        {
          src: "eeny",
        },
        {
      src: "miny"
    },
        {
          src: "moe",
        },
      ],
    });",
    }
  `);
});

test('should be possible to add a new invoke at the end of the existing invoke list', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        invoke: [
          {
            src: "eeny",
          },
          {
            src: "miny",
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
      type: 'add_invoke',
      path: [],
      invokeIndex: 2,
      source: 'moe',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      invoke: [
        {
          src: "eeny",
        },
        {
          src: "miny",
        },
        {
          src: "moe"
        },
      ],
    });",
    }
  `);
});
