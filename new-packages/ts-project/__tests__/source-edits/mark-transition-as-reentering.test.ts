import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test(`should be possible to mark a transition as reentering (just target)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: ".a1",
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: true,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
              reenter: true
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to mark a transition as reentering (object, no reenter property)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: true,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
              reenter: true,
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to mark a transition as reentering (object, reenter false)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
                reenter: false,
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: true,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
              reenter: true,
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to mark a transition as non-reentering (just target)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: ".a1",
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: false,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
              reenter: false
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to mark a transition as non-reentering (object, no reenter property)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: false,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
              reenter: false,
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to mark a transition as non-reentering (object, reenter true)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
                reenter: true,
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: false,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
              reenter: false,
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to remove reenter property (reenter true)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
                reenter: true,
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to remove reenter property (reenter false)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
                reenter: false,
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});

test(`should be possible to remove reenter property (multiple properties)`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a1",
                reenter: false,
                reenter: true,
              },
            },
            states: {
              a1: {},
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
      type: 'mark_transition_as_reentering',
      sourcePath: ['a'],
      transitionPath: ['on', 'NEXT', 0],
      reenter: undefined,
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        a: {
          on: {
            NEXT: {
              target: ".a1",
            },
          },
          states: {
            a1: {},
          },
        },
      },
    });",
    }
  `);
});
