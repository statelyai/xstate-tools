import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should rename an identifier state name to an identifier', async () => {
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
        NEW_NAME: {},
        bar: {},
      },
    });",
    }
  `,
  );
});

test('should rename an identifier state name to one using string literal for not valid identifiers (single quote preference)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      // prettier-ignore
      import { createMachine } from 'xstate';

      createMachine({
        // prettier-ignore
        type: 'parallel',
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
      name: 'NOT A VALID IDENTIFIER',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "// prettier-ignore
    import { createMachine } from 'xstate';

    createMachine({
      // prettier-ignore
      type: 'parallel',
      states: {
        'NOT A VALID IDENTIFIER': {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one using string literal for not valid identifiers (double quote preference)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      // prettier-ignore
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
      name: 'NOT A VALID IDENTIFIER',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "// prettier-ignore
    import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        "NOT A VALID IDENTIFIER": {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one with single quotes (single quote preference)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      // prettier-ignore
      import { createMachine } from 'xstate';

      createMachine({
        // prettier-ignore
        type: 'parallel',
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
      name: `what's this?`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "// prettier-ignore
    import { createMachine } from 'xstate';

    createMachine({
      // prettier-ignore
      type: 'parallel',
      states: {
        "what's this?": {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one with single quotes (double quote preference)', async () => {
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
      name: `what's this?`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        "what's this?": {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one with double quotes (single quote preference)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      // prettier-ignore
      import { createMachine } from 'xstate';

      createMachine({
        // prettier-ignore
        type: 'parallel',
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
      name: `"To be, or not to be..."`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "// prettier-ignore
    import { createMachine } from 'xstate';

    createMachine({
      // prettier-ignore
      type: 'parallel',
      states: {
        '"To be, or not to be..."': {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one with double quotes (double quote preference)', async () => {
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
      name: `"To be, or not to be..."`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        '"To be, or not to be..."': {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one with single and double quotes', async () => {
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
      name: `'oh my', "what's this?"`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        [\`'oh my', "what's this?"\`]: {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename an identifier state name to one with a new line', async () => {
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
      name: `a\nb\nc`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        [\`a\\nb\\nc\`]: {},
        bar: {},
      },
    });",
    }
  `);
});

test('should rename a square bracket state name to an identifier', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        type: "parallel",
        states: {
          [\`this has to be square-bracketed ('")\`]: {},
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
      path: [`this has to be square-bracketed ('")`],
      name: `foo`,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      type: "parallel",
      states: {
        foo: {},
        bar: {},
      },
    });",
    }
  `);
});
