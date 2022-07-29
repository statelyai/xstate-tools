import { transformFile } from "..";
import { NodePath, types } from "@babel/core";
import {
  MachineParseResult,
  parseMachinesFromFile,
  StateNodeReturn,
} from "@xstate/machine-extractor";
import { MachineConfig } from "xstate";
import {
  InvokeConfigObjectType,
  InvokeNode,
} from "@xstate/machine-extractor/src/invoke";

const unsafeRegex = /(^[0-9])|( )/g;

const getObjectKeyAST = (key: string) => {
  if (unsafeRegex.test(key) || key.length === 0) {
    return types.stringLiteral(key);
  }
  return types.identifier(key);
};

const getParentPath = (path: string[]) => {
  if (path.length === 0) return undefined;
  return path.slice(0, -1);
};

const deleteState = (path: string[], machine: MachineParseResult) => {
  // Remove the node from the machine
  const stateNode = machine.getStateNodeByPath(path);
  if (!stateNode?.ast._path.parentPath.removed) {
    stateNode?.ast._path.parentPath?.remove();
  }

  // Remove the property from the parent states node
  const parentPath = getParentPath(path);
  if (parentPath) {
    const parentNode = machine.getStateNodeByPath(parentPath);

    const keyNode = parentNode?.ast.states?.properties.find((property) => {
      return property.key === path[path.length - 1];
    });

    if (!keyNode?.propertyPath.removed) {
      keyNode?.propertyPath.remove();
    }
  }
};

const newChildToAst = (
  child: Omit<AdditionChild, "id">
): types.ObjectExpression => {
  if (child.children.length === 0) {
    return types.objectExpression([]);
  }

  return types.objectExpression([
    types.objectProperty(
      types.identifier("states"),
      types.objectExpression(
        child.children.map((child) => {
          return types.objectProperty(
            getObjectKeyAST(child.key),
            newChildToAst(child)
          );
        })
      )
    ),
  ]);
};

const addState = (
  parentPath: string[],
  machine: MachineParseResult,
  key: string,
  children: AdditionChild[]
) => {
  // Remove the node from the machine
  const stateNode = machine.getStateNodeByPath(parentPath);

  const nodeAst = newChildToAst({ key, children });

  if (stateNode?.ast.states?.path) {
    stateNode?.ast.states?.path.pushContainer(
      "properties",
      types.objectProperty(getObjectKeyAST(key), nodeAst)
    );
  } else {
    stateNode?.ast._path.pushContainer(
      "properties",
      types.objectProperty(
        types.identifier("states"),
        types.objectExpression([
          types.objectProperty(getObjectKeyAST(key), nodeAst),
        ])
      )
    );
  }
};

const renameState = (
  path: string[],
  machine: MachineParseResult,
  name: string
) => {
  const parentPath = getParentPath(path);
  if (parentPath) {
    const parentNode = machine.getStateNodeByPath(parentPath);

    const keyNode = parentNode?.ast.states?.properties.find((property) => {
      return property.key === path[path.length - 1];
    });

    if (keyNode?.propertyPath.isObjectProperty()) {
      keyNode.propertyPath.get("key").replaceWith(getObjectKeyAST(name));
    }
  }
};

const changeStateNodeValue = <
  TKey extends "id" | "history" | "initial" | "key" | "type"
>(
  path: string[],
  machine: MachineParseResult,
  key: TKey,
  value: MachineConfig<any, any, any>[TKey]
) => {
  const stateNode = machine.getStateNodeByPath(path);

  const valuePath = stateNode?.ast?.[key]?.path;

  if (!value) {
    valuePath?.parentPath?.remove();
    return;
  }

  let newValue;

  if (typeof value === "boolean") {
    newValue = types.booleanLiteral(value);
  } else if (typeof value === "number") {
    newValue = types.numericLiteral(value);
  } else {
    newValue = types.stringLiteral(`${value}`);
  }

  if (valuePath && "replaceWith" in valuePath) {
    valuePath.replaceWith(newValue);
  } else if (!valuePath) {
    stateNode?.ast._path.pushContainer(
      "properties",
      types.objectProperty(types.identifier(key), newValue)
    );
  }
};

describe("Recast experiment", () => {
  it("REPL", () => {
    const src = `
		createMachine({
        // Wow
				initial: 'a',
        type: 'parallel',
				states: {
					a: {},
					b: {},
				},
			});`;

    const newSrc = transformFile(src, ({ machines }) => {
      const machine = machines[0];

      changeStateNodeValue([], machine, "initial", "d");
      changeStateNodeValue([], machine, "type", undefined);
      changeStateNodeValue([], machine, "id", "machine");

      renameState(["b"], machine, "d");
    });

    expect(newSrc).toMatchInlineSnapshot(`
      "
      		createMachine({
              // Wow
      				initial: \\"d\\",
              states: {
                  a: {},
                  d: {},
              },
      				id: \\"machine\\",
      			});"
    `);
  });
});

interface PreservableItems {
  states: {
    [id: string]: {
      /**
       * The path of the state node in the current code
       */
      pathInCode: string[];
      invokeIds: string[];
    };
  };
  // transitions: {
  //   [id: string]: {
  //     stateNodePath: string[];
  //   };
  // };
}

interface InvokeUpdate {
  id: string;
  info: {
    src: string;
    id?: string;
  };
}

interface NonRootStateUpdate {
  key: string;
  parentId: string;
  invokes: InvokeUpdate[];
}

interface RootStateUpdate {
  key: null;
  parentId: null;
  invokes: InvokeUpdate[];
}

interface ConfigUpdateEvent {
  states: {
    [id: string]: NonRootStateUpdate | RootStateUpdate;
  };
  config: MachineConfig<any, any, any>;
}

const resolveRenamesAdditionsAndDeletionsOfStates = (
  db: PreservableItems,
  update: ConfigUpdateEvent
) => {
  const allStates = Object.entries(db.states);

  const statesToBeRenamed = allStates.filter(([id, item]) => {
    if (!update.states[id]?.key) return false;
    return (
      update.states[id]?.key !== item.pathInCode[item.pathInCode.length - 1]
    );
  });

  const statesToBeDeleted = allStates.filter(([id, item]) => {
    return !update.states[id];
  });

  const statesToBeAdded = Object.entries(update.states).filter(
    (entry): entry is [string, NonRootStateUpdate] => {
      const [id, item] = entry;
      return !db.states[id] && item.parentId && db.states[item.parentId];
    }
  );

  return {
    renames: statesToBeRenamed
      .map(([id, item]) => {
        return {
          id,
          newKey: update.states[id].key,
          pathInCode: item.pathInCode,
        };
      })
      .filter(
        (
          item
        ): item is { id: string; newKey: string; pathInCode: string[] } => {
          return Boolean(item.newKey);
        }
      ),
    deletions: statesToBeDeleted.map(([id, item]) => {
      return {
        id,
        pathInCode: item.pathInCode,
      };
    }),
    additions: statesToBeAdded.map(([id, item]): Addition => {
      return {
        id,
        parentPath: db.states[item.parentId].pathInCode,
        key: item.key,
        children: getAdditionChildren(id, update.states),
      };
    }),
  };
};

const getAdditionChildren = (
  id: string,
  states: ConfigUpdateEvent["states"]
): AdditionChild[] => {
  const children = Object.entries(states).filter(
    ([, item]) => item.parentId === id
  );

  return children.map(([id, item]) => {
    return {
      id,
      key: item.key as string,
      children: getAdditionChildren(id, states),
    };
  });
};

interface Addition {
  id: string;
  key: string;
  parentPath: string[];
  children: AdditionChild[];
}

interface AdditionChild {
  id: string;
  children: AdditionChild[];
  key: string;
}

describe("resolveRenamesAdditionsAndDeletionsOfStates", () => {
  it("REPL", () => {
    expect(
      resolveRenamesAdditionsAndDeletionsOfStates(
        {
          states: {
            root: {
              pathInCode: [],
              invokeIds: [],
            },

            a: {
              pathInCode: ["a"],
              invokeIds: [],
            },

            b: { pathInCode: ["b"], invokeIds: [] },
          },
        },

        {
          config: {},
          states: {
            root: {
              parentId: null,
              key: null,
              invokes: [],
            },

            a: {
              key: "awdawdawd",
              parentId: "root",
              invokes: [],
            },

            c: {
              key: "c",
              parentId: "root",
              invokes: [],
            },

            d: {
              key: "d",
              parentId: "c",
              invokes: [],
            },
          },
        }
      )
    ).toMatchInlineSnapshot(`
      Object {
        "additions": Array [
          Object {
            "children": Array [
              Object {
                "children": Array [],
                "id": "d",
                "key": "d",
              },
            ],
            "id": "c",
            "key": "c",
            "parentPath": Array [],
          },
        ],
        "deletions": Array [
          Object {
            "id": "b",
            "pathInCode": Array [
              "b",
            ],
          },
        ],
        "renames": Array [
          Object {
            "id": "a",
            "newKey": "awdawdawd",
            "pathInCode": Array [
              "a",
            ],
          },
        ],
      }
    `);
  });
});

function uniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

const createPreservableItems = (
  parseResult: MachineParseResult
): PreservableItems => {
  const items: PreservableItems = {
    states: {},
  };

  parseResult.getAllStateNodes().map((stateNode) => {
    const id = uniqueId();
    items.states[id] = {
      pathInCode: stateNode.path,
      invokeIds: stateNode.ast.invoke?.map(() => uniqueId()) || [],
    };
  });

  return items;
};

const resolveNewInvokes = (
  stateNode: StateNodeReturn,
  newInvokes: {
    id: string;
    info: { src: string; id?: string };
  }[],
  getNodePathByInvokeId: (id: string) => InvokeConfigObjectType | undefined
) => {
  const invokesAsAST: types.ObjectExpression[] = newInvokes.map((invoke) => {
    const existingInvokeNode = getNodePathByInvokeId(invoke.id);

    if (existingInvokeNode) {
      // TODO
      if (invoke.info.id) {
        if (existingInvokeNode.id) {
          existingInvokeNode.id?.path.replaceWith(
            types.stringLiteral(invoke.info.id)
          );
        } else {
          existingInvokeNode._path.pushContainer(
            "properties",
            types.objectProperty(
              types.identifier("id"),
              types.stringLiteral(invoke.info.id)
            )
          );
        }
      }

      if (existingInvokeNode.src) {
        if (existingInvokeNode.src.declarationType === "named") {
          existingInvokeNode.src?.path.replaceWith(
            types.stringLiteral(invoke.info.src)
          );
        }
      } else {
        existingInvokeNode._path.pushContainer(
          "properties",
          types.objectProperty(
            types.identifier("src"),
            types.stringLiteral(invoke.info.src)
          )
        );
      }

      return existingInvokeNode._path.node;
    }

    return types.objectExpression([
      types.objectProperty(
        types.identifier("src"),
        types.stringLiteral(invoke.info.src)
      ),
      ...(invoke.info.id
        ? [
            types.objectProperty(
              types.identifier("id"),
              types.stringLiteral(invoke.info.id)
            ),
          ]
        : []),
    ]);
  });

  if (invokesAsAST.length === 0) {
    return;
  }

  const invokesAsExpression =
    invokesAsAST.length > 1
      ? types.arrayExpression(invokesAsAST)
      : invokesAsAST[0];

  // If there's no invoke node, add the new invokes
  // as an array

  if (!stateNode.invoke) {
    stateNode._path.pushContainer(
      "properties",
      types.objectProperty(types.identifier("invoke"), invokesAsExpression)
    );
    return;
  }

  stateNode.invoke._valueNodePath?.replaceWith(invokesAsExpression);

  // If the ids are not identical, replace the entire array
  // and update their ids and src's in a single pass

  // Otherwise, only iterate through them and update their
  // ids
};

describe("createPreservableItems", () => {
  it("REPL", () => {
    const src = `
      createMachine({
        initial: 'a',
        states: {
          a: {},
          b: {
            initial: 'c',
            states: {
              c: {},
            },
          }
        }
      })
    `;
    const items = createPreservableItems(
      parseMachinesFromFile(src).machines[0]
    );

    expect(Object.values(items.states)).toMatchInlineSnapshot(`
      Array [
        Object {
          "invokeIds": Array [],
          "pathInCode": Array [],
        },
        Object {
          "invokeIds": Array [],
          "pathInCode": Array [
            "a",
          ],
        },
        Object {
          "invokeIds": Array [],
          "pathInCode": Array [
            "b",
          ],
        },
        Object {
          "invokeIds": Array [],
          "pathInCode": Array [
            "b",
            "c",
          ],
        },
      ]
    `);
  });
});

const transformations: ((
  src: string,
  preservedItems: PreservableItems,
  event: ConfigUpdateEvent,
  machineIndex: number
) => {
  src: string;
  preservedItems: PreservableItems;
})[] = [
  (src, preservedItems, event, machineIndex) => {
    const newPreservedItems = Object.assign({}, preservedItems);

    const newSrc = transformFile(src, ({ machines }) => {
      const machine = machines[machineIndex];

      const stateChanges = resolveRenamesAdditionsAndDeletionsOfStates(
        preservedItems,
        event
      );

      stateChanges.renames.forEach((rename) => {
        renameState(rename.pathInCode, machine, rename.newKey);
      });
      stateChanges.deletions.forEach((deletion) => {
        deleteState(deletion.pathInCode, machine);
      });
      stateChanges.additions.forEach((addition) => {
        addState(addition.parentPath, machine, addition.key, addition.children);
      });

      const addAdditionChildToPreservableItems = (
        child: AdditionChild,
        parentPath: string[]
      ) => {
        const newPath = [...parentPath, child.key];
        newPreservedItems.states[child.id] = {
          invokeIds: event.states[child.id].invokes.map((invoke) => invoke.id),
          pathInCode: newPath,
        };
        child.children.forEach((child) => {
          addAdditionChildToPreservableItems(child, newPath);
        });
      };

      stateChanges.additions.forEach((addition) => {
        const newPath = [...addition.parentPath, addition.key];
        newPreservedItems.states[addition.id] = {
          invokeIds: event.states[addition.id].invokes.map(
            (invoke) => invoke.id
          ),
          pathInCode: newPath,
        };
        addition.children.forEach((child) => {
          addAdditionChildToPreservableItems(child, newPath);
        });
      });
      stateChanges.deletions.forEach((deletion) => {
        delete newPreservedItems.states[deletion.id];
      });
      stateChanges.renames.forEach((rename) => {
        const oldKey = rename.pathInCode[rename.pathInCode.length - 1];

        /**
         * -1 for root, 0 for first child, 1 for second child, etc.
         */
        const depth = rename.pathInCode.length - 1;

        newPreservedItems.states[rename.id] = {
          ...newPreservedItems.states[rename.id],
          pathInCode: [...rename.pathInCode.slice(0, -1), rename.newKey],
        };

        if (depth === -1) {
          return;
        }

        Object.keys(newPreservedItems.states).forEach((id) => {
          const path = newPreservedItems.states[id].pathInCode;

          /**
           * If the path of this state at the depth of the rename is
           * the same as the old key, update it to the new key.
           */
          if (path[depth] === oldKey) {
            path[depth] = rename.newKey;
          }
        });
      });
    });

    return {
      src: newSrc,
      preservedItems: newPreservedItems,
    };
  },
  (src, preservedItems, event, machineIndex) => {
    const newPreservedItems = Object.assign({}, preservedItems);

    Object.entries(event.states).forEach(([id, state]) => {
      newPreservedItems.states[id] = {
        ...preservedItems.states[id],
        invokeIds: state.invokes.map((invoke) => invoke.id),
      };
    });

    const newSrc = transformFile(src, ({ machines }) => {
      const machine = machines[machineIndex];

      const getInvokeNodeById = (invokeId: string) => {
        const entry = Object.entries(preservedItems.states).find(
          ([, state]) => {
            return state.invokeIds.some(
              (invokeIdToCheck) => invokeIdToCheck === invokeId
            );
          }
        );

        if (!entry) {
          return undefined;
        }

        const [stateId, state] = entry;

        // Because of the search above, this will never be -1
        const invokeIndex = state.invokeIds.findIndex(
          (invokeIdToCheck) => invokeIdToCheck === invokeId
        );

        const statePath = newPreservedItems.states[stateId]?.pathInCode;

        if (!statePath) return;

        return machine.getStateNodeByPath(statePath)?.ast.invoke?.[invokeIndex];
      };

      Object.entries(newPreservedItems.states).map(([id, item]) => {
        const stateNode = machine.getStateNodeByPath(item.pathInCode);

        if (!stateNode) return;

        resolveNewInvokes(
          stateNode.ast,
          event.states[id].invokes,
          getInvokeNodeById
        );
      });

      Object.entries(newPreservedItems.states).map(([id, item]) => {
        const stateNode = machine.getStateNodeByPath(item.pathInCode);

        if (!stateNode) return;

        const invokes = event.states[id].invokes;

        if (invokes.length === 0) {
          stateNode.ast.invoke?._valueNodePath?.parentPath?.remove();
        }
      });
    });

    return {
      src: newSrc,
      preservedItems: newPreservedItems,
    };
  },
];

const transformFileFromEvent = (
  src: string,
  preservedItems: PreservableItems,
  event: ConfigUpdateEvent,
  machineIndex: number
): {
  src: string;
  preservedItems: PreservableItems;
} => {
  return transformations.reduce(
    ({ src, preservedItems }, transform) => {
      return transform(src, preservedItems, event, machineIndex);
    },
    {
      src,
      preservedItems,
    }
  );
};

describe("transformFileFromEvent", () => {
  it("REPL", () => {
    const src = `
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              AWESOME: 'b'
            }
          },
          b: {
            data: {},
            invoke: [{
              src: 'mySrc',
              data: {
                amazing: true
              },
            }, {
              src: async () => {},
            }]
          },
        }
      })
    `;

    const preservedItems = createPreservableItems(
      parseMachinesFromFile(src).machines[0]
    );

    const [rootStateId] = Object.entries(preservedItems.states).find(
      ([, state]) => state.pathInCode.join() === ""
    )!;

    const [aStateId] = Object.entries(preservedItems.states).find(
      ([, state]) => state.pathInCode.join() === "a"
    )!;
    const [bStateId, bState] = Object.entries(preservedItems.states).find(
      ([, state]) => state.pathInCode.join() === "b"
    )!;

    const invokeId = bState.invokeIds[0];
    const invoke2Id = bState.invokeIds[1];

    const event: ConfigUpdateEvent = {
      config: {},
      states: {
        [rootStateId]: {
          parentId: null,
          key: null,
          invokes: [],
        },
        [aStateId]: {
          key: "a",
          parentId: rootStateId,
          invokes: [],
        },
        [bStateId]: {
          key: "adwaaw",
          parentId: rootStateId,
          invokes: [
            {
              id: invokeId,
              info: {
                src: "mySrc",
                id: "brilliant",
              },
            },
          ],
        },
        deeper: {
          parentId: bStateId,
          key: "newState",
          invokes: [],
        },
        superDeep: {
          parentId: "deeper",
          key: "wow",
          invokes: [
            {
              id: invoke2Id,
              info: {
                src: "awd",
              },
            },
          ],
        },
      },
    };

    const result = transformFileFromEvent(src, preservedItems, event, 0);

    expect(result.src).toMatchInlineSnapshot(`
      "
            createMachine({
              initial: 'a',
              states: {
                a: {
                  on: {
                    AWESOME: 'b'
                  }
                },
                adwaaw: {
                  data: {},

                  invoke: {
                    src: \\"mySrc\\",

                    data: {
                      amazing: true
                    },

                    id: \\"brilliant\\"
                  },

                  states: {
                    newState: {
                      states: {
                        wow: {
                          invoke: {
                            src: \\"awd\\"
                          }
                        }
                      }
                    }
                  }
                },
              }
            })
          "
    `);

    expect(
      Object.values(result.preservedItems.states).map((state) => ({
        pathInCode: state.pathInCode,
        invokes: state.invokeIds.length,
      }))
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "invokes": 0,
          "pathInCode": Array [],
        },
        Object {
          "invokes": 0,
          "pathInCode": Array [
            "a",
          ],
        },
        Object {
          "invokes": 1,
          "pathInCode": Array [
            "adwaaw",
          ],
        },
        Object {
          "invokes": 0,
          "pathInCode": Array [
            "adwaaw",
            "newState",
          ],
        },
        Object {
          "invokes": 1,
          "pathInCode": Array [
            "adwaaw",
            "newState",
            "wow",
          ],
        },
      ]
    `);
  });
});
