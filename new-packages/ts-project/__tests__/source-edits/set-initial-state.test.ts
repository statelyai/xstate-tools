import { outdent } from 'outdent';
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

test('should add initial state to root', async () => {
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
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
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
  `);
});

test("should add initial state before `states` property's comments", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        // comment
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
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "bar",
      // comment
      states: {
        foo: {},
        bar: {},
      },
    });",
    }
  `);
});

test('should successfully add initial state before `states` property with no leading whitespace whatsoever', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    // ignore Prettier here by using outdent
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({states: {
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
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({initial: "bar",
    states: {
        foo: {},
        bar: {},
      },
    });",
    }
  `);
});

test('should add initial state using `states` property indentation', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    // ignore Prettier here by using outdent
    'index.ts': outdent`
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
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
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
  `);
});

test('should be able to remove an initial state from a root', async () => {
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

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    {
      type: 'set_initial_state',
      path: [],
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state from a nested state', async () => {
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          states: {
            bar: {},
          },
        },
      },
    });",
    }
  `);
});

test('should be able to remove an initial state (with trailing comment after its comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo", // comment
        states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state (with trailing comment before its comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo" /* comment */,
        states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state (with trailing comments before and after its comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "foo" /* comment */, // another comment
        states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state with leading comments', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        // comment 1
        // comment 2
        initial: "foo",
        states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state without removing trailing comment of the opening curly brace belonging to the containing object', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({ /* comm */
        initial: "foo",
        states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({ /* comm */
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state that is not positioned on its own line', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        id: "root", initial: "foo",
        states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "root"
      states: {
        foo: {},
      },
    });",
    }
  `);
});

test('should be able to remove an initial state that is between other properties on the same line', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        id: "root", initial: "foo", states: {
          foo: {},
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
      initialState: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      id: "root", states: {
        foo: {},
      },
    });",
    }
  `);
});
