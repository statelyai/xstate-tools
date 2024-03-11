import { outdent } from 'outdent';
import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from '../utils';

test(`should append a state after existing states of a nested state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {
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
      type: 'add_state',
      path: ['foo'],
      name: 'just_added',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {
          states: {
            bar: {},
            just_added: {},
          },
        },
      },
    });",
    }
  `);
});

test('should append a state after existing states (with trailing comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
        bar: {},
      },
    });",
    }
  `);
});

test('should append a state after existing states (without trailing comma)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {}
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
        bar: {}
      },
    });",
    }
  `);
});

test('should append a state after existing states (with trailing comma and single-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {}, // comment
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {}, // comment
        bar: {},
      },
    });",
    }
  `);
});

test('should append a state after existing states (without trailing comma and single-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {} // comment
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {}, // comment
        bar: {}
      },
    });",
    }
  `);
});

test('should append a state after existing states (with trailing comma after single-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {} // what a weird situation
          ,
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {} // what a weird situation
        ,
        bar: {},
      },
    });",
    }
  `);
});

test('should append a state after existing states (with trailing comma with its own trailing comment after single-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {} // what a weird situation
          , // weird indeed
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {} // what a weird situation
        , // weird indeed
        bar: {},
      },
    });",
    }
  `);
});

test('should append a state after existing states (with trailing comma and multi-line comment below it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {},
          /* comment */
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
        bar: {},
        /* comment */
      },
    });",
    }
  `);
});

test('should append a state after existing states (without trailing comma and multi-line comment below it)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {}
          /* comment */
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {},
        bar: {}
        /* comment */
      },
    });",
    }
  `);
});

test('should append a state after existing states (with trailing comma after multi-line trailing comment)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          foo: {}
          /* comment */ ,
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {}
        /* comment */ ,
        bar: {},
      },
    });",
    }
  `);
});

test('should add a state into an existing empty states property', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {},
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    [
      {
        type: 'add_state',
        path: [],
        name: 'foo',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {}
      },
    });",
    }
  `,
  );
});

test('should add a state into an existing empty states property (with comment inside)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
        states: {
          // comment
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'foo',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        // comment
        foo: {}
      },
    });",
    }
  `,
  );
});

test('should add a state into an existing empty states property (with comment after opening brace)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: { // comment
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'foo',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: { // comment
        foo: {}
      },
    });",
    }
  `,
  );
});

test('should add a state into an existing single-line empty states property (with comment inside)', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': outdent`
      import { createMachine } from "xstate";

      createMachine({
        states: { /* comment */ },
      });
    `,
  });

  const project = await createTestProject(tmpPath);

  const textEdits = project.editDigraph(
    {
      fileName: 'index.ts',
      machineIndex: 0,
    },
    [
      {
        type: 'add_state',
        path: [],
        name: 'foo',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: { /* comment */
        foo: {}
       },
    });",
    }
  `,
  );
});

test('should successfully add a state to the root and use it as initial state of its parent', async () => {
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'foo',
      },
      {
        type: 'set_initial_state',
        path: [],
        initialState: 'foo',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	initial: "foo",
    	states: {
    		foo: {}
    	}
    });",
    }
  `,
  );
});

// this shouldn't be possible in the Studio but we handle this here regardless
test('should be possible to add a state to the empty root (without making it its initial state)', async () => {
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
      type: 'add_state',
      path: [],
      name: 'just_added',
    },
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	states: {
    		just_added: {}
    	}
    });",
    }
  `);
});

test('should successfully add a state to a nested state and use it as initial state of its parent', async () => {
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
    [
      {
        type: 'add_state',
        path: ['foo'],
        name: 'bar',
      },
      {
        type: 'set_initial_state',
        path: ['foo'],
        initialState: 'bar',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      initial: "foo",
      states: {
        foo: {
          initial: "bar",
          states: {
            bar: {}
          }
        },
      },
    });",
    }
  `,
  );
});

test(`should be possible to add a state with name that isn't a valid identifier`, async () => {
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
    [
      {
        type: 'add_state',
        path: [],
        name: 'just added',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(
    `
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
    	states: {
    		"just added": {}
    	}
    });",
    }
  `,
  );
});

test(`should be possible to add a state to an empty nested state`, async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
      import { createMachine } from "xstate";

      createMachine({
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
    [
      {
        type: 'add_state',
        path: ['foo'],
        name: 'just_added',
      },
    ],
  );
  expect(await project.applyTextEdits(textEdits)).toMatchInlineSnapshot(`
    {
      "index.ts": "import { createMachine } from "xstate";

    createMachine({
      states: {
        foo: {
          states: {
            just_added: {}
          }
        },
      },
    });",
    }
  `);
});
