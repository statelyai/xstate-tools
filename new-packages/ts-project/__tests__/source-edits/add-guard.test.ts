import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test('should be possible to add a guard to a transition', async () => {
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
      type: 'add_guard',
      path: [],
      transitionPath: ['on', 'FOO', 0],
      name: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: {
          target: "a",
          guard: "isItTooLate"
        },
      },
      states: {
        a: {},
      },
    });",
    }
  `);
});

test('should be possible to add a guard to an object transition', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: {
            target: "a",
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
      type: 'add_guard',
      path: [],
      transitionPath: ['on', 'FOO', 0],
      name: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: {
          target: "a",
          guard: "isItTooLate",
        },
      },
      states: {
        a: {},
      },
    });",
    }
  `);
});

test('should be possible to add a guard to the first transition for a given event', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: ["a", "b", "c"],
        },
        states: {
          a: {},
          b: {},
          c: {},
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
      type: 'add_guard',
      path: [],
      transitionPath: ['on', 'FOO', 0],
      name: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: [{
          target: "a",
          guard: "isItTooLate"
        }, "b", "c"],
      },
      states: {
        a: {},
        b: {},
        c: {},
      },
    });",
    }
  `);
});

test('should be possible to add a guard to the last transition for a given event', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: ["a", "b", "c"],
        },
        states: {
          a: {},
          b: {},
          c: {},
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
      type: 'add_guard',
      path: [],
      transitionPath: ['on', 'FOO', 2],
      name: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: ["a", "b", {
          target: "c",
          guard: "isItTooLate"
        }],
      },
      states: {
        a: {},
        b: {},
        c: {},
      },
    });",
    }
  `);
});

test('should be possible to add a guard to a middle transition for a given event', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        on: {
          FOO: ["a", "b", "c"],
        },
        states: {
          a: {},
          b: {},
          c: {},
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
      type: 'add_guard',
      path: [],
      transitionPath: ['on', 'FOO', 1],
      name: 'isItTooLate',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      on: {
        FOO: ["a", {
          target: "b",
          guard: "isItTooLate"
        }, "c"],
      },
      states: {
        a: {},
        b: {},
        c: {},
      },
    });",
    }
  `);
});

test(`should be possible to add a guard to invoke's onDone`, async () => {
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
      type: 'add_guard',
      path: ['a'],
      transitionPath: ['invoke', 0, 'onDone', 0],
      name: 'isHeBusy',
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
              guard: "isHeBusy"
            },
          },
        },
        b: {},
      },
    });",
    }
  `);
});

test(`should be possible to add a guard to a transition defined for an empty event`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        initial: "a",
        states: {
          a: {
            on: {
              "": "b",
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
      type: 'add_guard',
      path: ['a'],
      transitionPath: ['on', '', 0],
      name: 'isItHalfEmpty',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "a",
      states: {
        a: {
          on: {
            "": {
              target: "b",
              guard: "isItHalfEmpty"
            },
          },
        },
        b: {},
      },
    });",
    }
  `);
});
