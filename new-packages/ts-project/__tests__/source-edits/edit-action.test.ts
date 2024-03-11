import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to update a single entry action name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: "callDavid",
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
      type: 'edit_action',
      path: [],
      actionPath: ['entry', 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: "getRaise",
    });",
    }
  `);
});

test('should be possible to update a single object entry action name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: {
          type: "callDavid",
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
      type: 'edit_action',
      path: [],
      actionPath: ['entry', 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: {
        type: "getRaise",
      },
    });",
    }
  `);
});

test('should be possible to update a single exit action name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        exit: "callDavid",
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
      type: 'edit_action',
      path: [],
      actionPath: ['exit', 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      exit: "getRaise",
    });",
    }
  `);
});

test('should be possible to update a single object exit action name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        exit: {
          type: "callDavid",
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
      type: 'edit_action',
      path: [],
      actionPath: ['exit', 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      exit: {
        type: "getRaise",
      },
    });",
    }
  `);
});

test('should be possible to update entry action name in an array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["callDavid", "getRaise"],
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
      type: 'edit_action',
      path: [],
      actionPath: ['entry', 1],
      name: 'keepTheJob',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: ["callDavid", "keepTheJob"],
    });",
    }
  `);
});

test('should be possible to update object entry action name in an array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        entry: ["callDavid", { type: "getRaise" }],
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
      type: 'edit_action',
      path: [],
      actionPath: ['entry', 1],
      name: 'keepTheJob',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      entry: ["callDavid", { type: "keepTheJob" }],
    });",
    }
  `);
});

test('should be possible to update exit action name in an array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        exit: ["callDavid", "getRaise"],
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
      type: 'edit_action',
      path: [],
      actionPath: ['exit', 1],
      name: 'keepTheJob',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      exit: ["callDavid", "keepTheJob"],
    });",
    }
  `);
});

test('should be possible to update object exit action name in an array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        exit: ["callDavid", { type: "getRaise" }],
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
      type: 'edit_action',
      path: [],
      actionPath: ['exit', 1],
      name: 'keepTheJob',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      exit: ["callDavid", { type: "keepTheJob" }],
    });",
    }
  `);
});

test('should be possible to update a single transition action name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: {
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
      type: 'edit_action',
      path: [],
      actionPath: ['on', 'CALL_HIM_MAYBE', 0, 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: {
          actions: "getRaise",
        },
      },
    });",
    }
  `);
});

test('should be possible to update a single transition object action name', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            actions: { type: "callDavid" },
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
      type: 'edit_action',
      path: [],
      actionPath: ['on', 'CALL_HIM_MAYBE', 0, 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: {
          actions: { type: "getRaise" },
        },
      },
    });",
    }
  `);
});

test('should be possible to update an action name within the nth guarded transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: [
            {
              guard: "isItTooLate",
            },
            {
              actions: "callDavid",
            },
          ],
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
      type: 'edit_action',
      path: [],
      actionPath: ['on', 'CALL_HIM_MAYBE', 1, 0],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: [
          {
            guard: "isItTooLate",
          },
          {
            actions: "getRaise",
          },
        ],
      },
    });",
    }
  `);
});

test('should be possible to update a transition action name in an array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            actions: ["callDavid", "keepTheJob"],
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
      type: 'edit_action',
      path: [],
      actionPath: ['on', 'CALL_HIM_MAYBE', 0, 1],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: {
          actions: ["callDavid", "getRaise"],
        },
      },
    });",
    }
  `);
});

test('should be possible to update an object transition action name in an array', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            actions: [
              "callDavid",
              {
                type: "keepTheJob",
              },
            ],
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
      type: 'edit_action',
      path: [],
      actionPath: ['on', 'CALL_HIM_MAYBE', 0, 1],
      name: 'getRaise',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        CALL_HIM_MAYBE: {
          actions: [
            "callDavid",
            {
              type: "getRaise",
            },
          ],
        },
      },
    });",
    }
  `);
});
