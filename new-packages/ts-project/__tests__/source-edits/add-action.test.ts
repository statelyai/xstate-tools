import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to add an entry action to the root', async () => {
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
      type: 'add_action',
      path: [],
      actionPath: ['entry', 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	entry: "doStuff"
    });",
    }
  `);
});

test('should be possible to add an entry action to a nested state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "a",
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
      type: 'add_action',
      path: ['a'],
      actionPath: ['entry', 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          entry: "doStuff"
        },
      },
    });",
    }
  `);
});

test('should be possible to add an exit action to the root', async () => {
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
      type: 'add_action',
      path: [],
      actionPath: ['exit', 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	exit: "doStuff"
    });",
    }
  `);
});

test('should be possible to add an exit action to a nested state', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "a",
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
      type: 'add_action',
      path: ['a'],
      actionPath: ['exit', 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          exit: "doStuff"
        },
      },
    });",
    }
  `);
});

test('should be possible to add an entry action to an existing single entry action', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: "bark",
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
      type: 'add_action',
      path: [],
      actionPath: ['entry', 1],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: [
        "bark",
        "doStuff"
      ],
    });",
    }
  `);
});

test('should be possible to add an exit action to an existing single exit action', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        exit: "bark",
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
      type: 'add_action',
      path: [],
      actionPath: ['exit', 1],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      exit: [
        "bark",
        "doStuff"
      ],
    });",
    }
  `);
});

test('should be possible to add an entry action at the start of the existing entry actions', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["bark", "meow"],
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
      type: 'add_action',
      path: [],
      actionPath: ['entry', 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: ["doStuff",
      "bark", "meow"],
    });",
    }
  `);
});

test('should be possible to add an entry action at the end of the existing entry actions', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["bark", "meow"],
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
      type: 'add_action',
      path: [],
      actionPath: ['entry', 2],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: ["bark", "meow",
      "doStuff"],
    });",
    }
  `);
});

test('should be possible to add an entry action in the middle of existing entry actions', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["bark", "meow"],
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
      type: 'add_action',
      path: [],
      actionPath: ['entry', 1],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: ["bark", "doStuff",
      "meow"],
    });",
    }
  `);
});

test('should be possible to add a transition action to the root', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: ".a",
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
      type: 'add_action',
      path: [],
      actionPath: ['on', 'FOO', 0, 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: {
          target: ".a",
          actions: "doStuff"
        },
      },
      states: {
        a: {},
      },
    });",
    }
  `);
});

test(`should be possible to add a transition action to invoke's onDone`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            invoke: {
              src: "callDavid",
              onDone: "b",
            },
          },
          b: {},
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
      type: 'add_action',
      path: ['a'],
      actionPath: ['invoke', 0, 'onDone', 0, 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          invoke: {
            src: "callDavid",
            onDone: {
              target: "b",
              actions: "getRaise"
            },
          },
        },
        b: {},
      },
    });",
    }
  `);
});

test(`should be possible to add a transition action to an object transition`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: {
            target: ".a",
            description: "beautiful arrow, wow",
          },
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
      type: 'add_action',
      path: [],
      actionPath: ['on', 'FOO', 0, 0],
      name: 'doStuff',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: {
          target: ".a",
          description: "beautiful arrow, wow",
          actions: "doStuff",
        },
      },
      states: {
        a: {},
      },
    });",
    }
  `);
});

test(`should be possible to add a transition action to an existing transition action`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: {
            target: ".a",
            actions: "callDavid",
          },
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
      type: 'add_action',
      path: [],
      actionPath: ['on', 'FOO', 0, 1],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: {
          target: ".a",
          actions: [
            "callDavid",
            "getRaise"
          ],
        },
      },
      states: {
        a: {},
      },
    });",
    }
  `);
});
