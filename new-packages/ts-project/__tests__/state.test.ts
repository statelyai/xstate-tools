import { expect, test } from 'vitest';
import { createTestProject, testdir, ts } from './utils';

test('should extract states recursively', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
			import { createMachine } from "xstate";
	  
			createMachine({
				states: {
					state1: {
						states: {
							state2: {
								states: {
									state3: {},
								}
							}
						}
					},
					state4: {}
				}
			});
		  `,
  });

  const project = await createTestProject(tmpPath);
  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [
              {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "",
                  "metaEntries": [],
                  "tags": [],
                  "type": undefined,
                },
                "id": "state1",
                "states": [
                  {
                    "data": {
                      "description": undefined,
                      "entry": [],
                      "exit": [],
                      "history": undefined,
                      "initial": undefined,
                      "invoke": [],
                      "key": "",
                      "metaEntries": [],
                      "tags": [],
                      "type": undefined,
                    },
                    "id": "state1.state2",
                    "states": [
                      {
                        "data": {
                          "description": undefined,
                          "entry": [],
                          "exit": [],
                          "history": undefined,
                          "initial": undefined,
                          "invoke": [],
                          "key": "",
                          "metaEntries": [],
                          "tags": [],
                          "type": undefined,
                        },
                        "id": "state1.state2.state3",
                        "states": [],
                      },
                    ],
                  },
                ],
              },
              {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "",
                  "metaEntries": [],
                  "tags": [],
                  "type": undefined,
                },
                "id": "state4",
                "states": [],
              },
            ],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});

test('Should extract state.initial with string value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
			import { createMachine } from "xstate";
	  
			createMachine({
				initial: 'foo',
				states: {
					foo: {},
				}
			});
		  `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": "foo",
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [
              {
                "data": {
                  "description": undefined,
                  "entry": [],
                  "exit": [],
                  "history": undefined,
                  "initial": undefined,
                  "invoke": [],
                  "key": "",
                  "metaEntries": [],
                  "tags": [],
                  "type": undefined,
                },
                "id": "foo",
                "states": [],
              },
            ],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});

test('Should extract state.initial with undefined value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
			  import { createMachine } from "xstate";
		
			  createMachine({
				  initial: undefined,
				  states: {}
			  });
			`,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});

test('Should raise error when state.initial property has invalid value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
			  import { createMachine } from "xstate";
		
			  createMachine({
				  initial: {},
				  states: {}
			  });
			`,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [
          {
            "node": NodeObject {
              "end": 69,
              "exclamationToken": undefined,
              "flags": 0,
              "initializer": NodeObject {
                "end": 69,
                "flags": 0,
                "jsDoc": undefined,
                "kind": 210,
                "localSymbol": undefined,
                "modifierFlagsCache": 0,
                "multiLine": false,
                "parent": undefined,
                "pos": 66,
                "properties": [],
                "symbol": undefined,
                "transformFlags": 0,
              },
              "jsDoc": undefined,
              "kind": 303,
              "localSymbol": undefined,
              "modifierFlagsCache": 0,
              "modifiers": undefined,
              "name": IdentifierObject {
                "end": 65,
                "escapedText": "initial",
                "flags": 0,
                "flowNode": undefined,
                "jsDoc": undefined,
                "kind": 80,
                "modifierFlagsCache": 0,
                "parent": undefined,
                "pos": 56,
                "symbol": undefined,
                "transformFlags": 0,
              },
              "parent": undefined,
              "pos": 56,
              "questionToken": undefined,
              "symbol": undefined,
              "transformFlags": 0,
            },
            "type": "state_property_unhandled",
          },
        ],
      ],
    ]
  `);
});

test('Should extract state.type with value "parallel"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
			  import { createMachine } from "xstate";
		
			  createMachine({
				  type: 'parallel',
				  states: {}
			  });
			`,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": "parallel",
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});
test('Should extract state.type with value "final"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				import { createMachine } from "xstate";
		  
				createMachine({
					type: 'final',
					states: {}
				});
			  `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": "final",
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});

test('Should extract state.type with value "history"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				import { createMachine } from "xstate";
		  
				createMachine({
					type: 'history',
					states: {}
				});
			  `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": "history",
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});
test('Should extract state.type with value undefined', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				import { createMachine } from "xstate";
		  
				createMachine({
					type: undefined,
					states: {}
				});
			  `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});
test('Should raise error when state.type has invalid value', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				  import { createMachine } from "xstate";
			
				  createMachine({
					  type: 123,
					  states: {}
				  });
				`,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [
          {
            "node": NodeObject {
              "end": 67,
              "exclamationToken": undefined,
              "flags": 0,
              "initializer": NodeObject {
                "end": 67,
                "flags": 0,
                "kind": 9,
                "localSymbol": undefined,
                "modifierFlagsCache": 0,
                "numericLiteralFlags": 0,
                "parent": undefined,
                "pos": 63,
                "symbol": undefined,
                "text": "123",
                "transformFlags": 0,
              },
              "jsDoc": undefined,
              "kind": 303,
              "localSymbol": undefined,
              "modifierFlagsCache": 0,
              "modifiers": undefined,
              "name": IdentifierObject {
                "end": 62,
                "escapedText": "type",
                "flags": 0,
                "flowNode": undefined,
                "jsDoc": undefined,
                "kind": 80,
                "modifierFlagsCache": 0,
                "parent": undefined,
                "pos": 56,
                "symbol": undefined,
                "transformFlags": 0,
              },
              "parent": undefined,
              "pos": 56,
              "questionToken": undefined,
              "symbol": undefined,
              "transformFlags": 0,
            },
            "type": "state_property_unhandled",
          },
        ],
      ],
    ]
  `);
});

test('Should extract state.history with value "shallow"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				import { createMachine } from "xstate";
		  
				createMachine({
					history: 'shallow',
					states: {}
				});
			  `,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [
          {
            "node": NodeObject {
              "end": 76,
              "exclamationToken": undefined,
              "flags": 0,
              "initializer": NodeObject {
                "end": 76,
                "flags": 0,
                "hasExtendedUnicodeEscape": false,
                "kind": 11,
                "localSymbol": undefined,
                "modifierFlagsCache": 0,
                "parent": undefined,
                "pos": 66,
                "singleQuote": undefined,
                "symbol": undefined,
                "text": "shallow",
                "transformFlags": 0,
              },
              "jsDoc": undefined,
              "kind": 303,
              "localSymbol": undefined,
              "modifierFlagsCache": 0,
              "modifiers": undefined,
              "name": IdentifierObject {
                "end": 65,
                "escapedText": "history",
                "flags": 0,
                "flowNode": undefined,
                "jsDoc": undefined,
                "kind": 80,
                "modifierFlagsCache": 0,
                "parent": undefined,
                "pos": 56,
                "symbol": undefined,
                "transformFlags": 0,
              },
              "parent": undefined,
              "pos": 56,
              "questionToken": undefined,
              "symbol": undefined,
              "transformFlags": 0,
            },
            "type": "state_property_unhandled",
          },
        ],
      ],
    ]
  `);
});
test('Should extract state.history with value "deep"', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				  import { createMachine } from "xstate";
			
				  createMachine({
					  history: 'deep',
					  states: {}
				  });
				`,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [
          {
            "node": NodeObject {
              "end": 73,
              "exclamationToken": undefined,
              "flags": 0,
              "initializer": NodeObject {
                "end": 73,
                "flags": 0,
                "hasExtendedUnicodeEscape": false,
                "kind": 11,
                "localSymbol": undefined,
                "modifierFlagsCache": 0,
                "parent": undefined,
                "pos": 66,
                "singleQuote": undefined,
                "symbol": undefined,
                "text": "deep",
                "transformFlags": 0,
              },
              "jsDoc": undefined,
              "kind": 303,
              "localSymbol": undefined,
              "modifierFlagsCache": 0,
              "modifiers": undefined,
              "name": IdentifierObject {
                "end": 65,
                "escapedText": "history",
                "flags": 0,
                "flowNode": undefined,
                "jsDoc": undefined,
                "kind": 80,
                "modifierFlagsCache": 0,
                "parent": undefined,
                "pos": 56,
                "symbol": undefined,
                "transformFlags": 0,
              },
              "parent": undefined,
              "pos": 56,
              "questionToken": undefined,
              "symbol": undefined,
              "transformFlags": 0,
            },
            "type": "state_property_unhandled",
          },
        ],
      ],
    ]
  `);
});

test('Should extract state.history with value undefined', async () => {
  const tmpPath = await testdir({
    'tsconfig.json': JSON.stringify({}),
    'index.ts': ts`
				  import { createMachine } from "xstate";
			
				  createMachine({
					  history: undefined,
					  states: {}
				  });
				`,
  });

  const project = await createTestProject(tmpPath);

  expect(project.extractMachines('index.ts')).toMatchInlineSnapshot(`
    [
      [
        {
          "edges": [],
          "rootState": {
            "data": {
              "description": undefined,
              "entry": [],
              "exit": [],
              "history": undefined,
              "initial": undefined,
              "invoke": [],
              "key": "",
              "metaEntries": [],
              "tags": [],
              "type": undefined,
            },
            "id": "",
            "states": [],
          },
          "states": [],
        },
        [],
      ],
    ]
  `);
});
