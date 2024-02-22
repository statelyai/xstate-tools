import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test("should be possible to set state's type to final", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'final',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "final"
        },
      },
    });",
    }
  `);
});

test("should be possible to set state's type to parallel", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'parallel',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "parallel"
        },
      },
    });",
    }
  `);
});

test("should be possible to set state's type to shallow history (default)", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'history',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "history"
        },
      },
    });",
    }
  `);
});

test("should be possible to set state's type to deep history", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'history',
      history: 'deep',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "history",
          history: "deep"
        },
      },
    });",
    }
  `);
});

test('should be possible to change history type from implicit shallow to deep', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            type: "history",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'history',
      history: 'deep',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "history",
          history: "deep",
        },
      },
    });",
    }
  `);
});

test('should be possible to change history type from explicit shallow to deep', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            history: "shallow",
            type: "history",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'history',
      history: 'deep',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          history: "deep",
          type: "history",
        },
      },
    });",
    }
  `);
});

test('should be possible to change history type from deep to shallow', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            type: "history",
            history: "deep",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'history',
      history: 'shallow',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "history",
        },
      },
    });",
    }
  `);
});

test("should be possible to set state's type to normal when it's already implicitly normal", async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

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
      type: 'set_state_type',
      path: ['a'],
      stateType: 'normal',
    },
  );
  // lack of change is expected
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`{}`);
});

test(`should be possible to set state's type to normal when it is of a different type`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            type: "final",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'normal',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
        },
      },
    });",
    }
  `);
});

test(`should be possible to set state's type to normal when it is a deep history state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            type: "history",
            history: "deep",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'normal',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
        },
      },
    });",
    }
  `);
});

test(`should be possible to set state's type to parallel when it is a deep history state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            type: "history",
            history: "deep",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'parallel',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "parallel",
        },
      },
    });",
    }
  `);
});

test(`should be possible to set state's type to final when it is a deep history state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { creteMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              NEXT: "b",
            },
          },
          b: {
            type: "history",
            history: "deep",
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
      type: 'set_state_type',
      path: ['b'],
      stateType: 'final',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { creteMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            NEXT: "b",
          },
        },
        b: {
          type: "final",
        },
      },
    });",
    }
  `);
});
