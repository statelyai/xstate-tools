import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('add_transition', () => {
  it('should be possible to add a targetless transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: null,
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: undefined
        }
      }"
    `);
  });

  it('should be possible to add a transition targeting the root from a nested state (implicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
            id: 'nested'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: [],
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
            id: 'nested',

            on: {
              FOO: "#(machine)"
            }
          }
        }
      }"
    `);
  });

  it('should be possible to add a transition targeting the root from a nested state (explicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'groot',
        initial: 'foo',
        states: {
          foo: {
            // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
            id: 'nested'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: [],
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'groot',
        initial: 'foo',
        states: {
          foo: {
            // this acts as an additional guard, allowing us to check that the algorithm truly has chosen the root's ID
            id: 'nested',

            on: {
              FOO: "#groot"
            }
          }
        }
      }"
    `);
  });

  it('should be possible to add an external self-transition to the root (implicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: [],
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: "#(machine)"
        }
      }"
    `);
  });

  it('should be possible to add an external self-transition to the root (explicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({ id: 'groot' })
	`);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: [],
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'groot',

        on: {
          FOO: "#groot"
        }
      }"
    `);
  });

  it('should be possible to add an internal self-transition to the root (implicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: [],
          transitionPath: ['on', 'FOO', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: {
            target: "#(machine)",
            internal: true
          }
        }
      }"
    `);
  });

  it('should be possible to add an internal self-transition to the root (explicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({ id: 'groot' })
	`);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: [],
          transitionPath: ['on', 'FOO', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'groot',

        on: {
          FOO: {
            target: "#groot",
            internal: true
          }
        }
      }"
    `);
  });

  it('should be possible to add an external self-transition to a state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['foo'],
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              FOO: "foo"
            }
          }
        }
      }"
    `);
  });

  it('should be possible to add an internal self-transition to a state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['foo'],
          transitionPath: ['on', 'FOO', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              FOO: {
                target: "foo",
                internal: true
              }
            }
          }
        }
      }"
    `);
  });

  it('should be possible to add a transition to an existing key', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar'
            }
          },
          bar: {},
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['baz'],
          transitionPath: ['on', 'OTHER', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar',
              OTHER: "baz"
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it('should be possible to add a transition at the end of the existing array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar']
            }
          },
          bar: {},
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['baz'],
          transitionPath: ['on', 'NEXT', 1],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', "baz"]
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it('should be possible to add a transition at the start of the existing array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar']
            }
          },
          bar: {},
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['baz'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ["baz", 'bar']
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it('should be possible to add a transition in the middle of the existing array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', 'qwe']
            }
          },
          bar: {},
          baz: {},
          qwe: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['baz'],
          transitionPath: ['on', 'NEXT', 1],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', "baz", 'qwe']
            }
          },
          bar: {},
          baz: {},
          qwe: {}
        }
      }"
    `);
  });

  it('should be possible to add a transition at the end of an upgraded array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar'
            }
          },
          bar: {},
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['baz'],
          transitionPath: ['on', 'NEXT', 1],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', "baz"]
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it('should be possible to add a transition at the start of an upgraded array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar'
            }
          },
          bar: {},
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['baz'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ["baz", 'bar']
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it("should be possible to add a transition to invoke's onDone", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService',
            }
          },
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['invoke', 0, 'onDone', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService',
              onDone: "bar"
            }
          },
          bar: {}
        }
      }"
    `);
  });

  it("should be possible to add a transition to invoke's onError", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService',
            }
          },
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['invoke', 0, 'onError', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService',
              onError: "bar"
            }
          },
          bar: {}
        }
      }"
    `);
  });

  it("should be possible to add a transition to the last invoke's onDone", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'anotherService',
            }]
          },
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['invoke', 1, 'onDone', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'anotherService',
              onDone: "bar"
            }]
          },
          bar: {}
        }
      }"
    `);
  });

  it("should be possible to add a transition to the first invoke's onDone", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'anotherService',
            }]
          },
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['invoke', 0, 'onDone', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
              onDone: "bar"
            }, {
              src: 'anotherService',
            }]
          },
          bar: {}
        }
      }"
    `);
  });

  it("should be possible to add a transition to a middle invoke's onDone", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'veryUsefulService',
            }, {
              src: 'anotherService',
            }]
          },
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['invoke', 1, 'onDone', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'veryUsefulService',
              onDone: "bar"
            }, {
              src: 'anotherService',
            }]
          },
          bar: {}
        }
      }"
    `);
  });

  it("should be possible to add a transition to state's onDone", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['onDone', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            onDone: "bar"
          },
          bar: {}
        }
      }"
    `);
  });

  it('should be possible to add an always transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['always', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            always: "bar"
          },
          bar: {}
        }
      }"
    `);
  });

  it('should use a relative child target when adding a transition to a child', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: ['bar'],
          transitionPath: ['on', 'NEXT', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',

        states: {
          foo: {},
          bar: {}
        },

        on: {
          NEXT: ".bar"
        }
      }"
    `);
  });

  it('should use a relative descendant target when adding a transition to a deep descendant from the root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {
            states: {
              bar2: {
                states: {
                  bar3: {}
                }
              }
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: ['bar', 'bar2', 'bar3'],
          transitionPath: ['on', 'NEXT', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',

        states: {
          foo: {},
          bar: {
            states: {
              bar2: {
                states: {
                  bar3: {}
                }
              }
            }
          }
        },

        on: {
          NEXT: ".bar.bar2.bar3"
        }
      }"
    `);
  });

  it('should use a relative descendant target when adding a transition to a deep descendant from a nested state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {
            states: {
              bar2: {
                states: {
                  bar3: {}
                }
              }
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['bar'],
          targetPath: ['bar', 'bar2', 'bar3'],
          transitionPath: ['on', 'NEXT', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {},
          bar: {
            states: {
              bar2: {
                states: {
                  bar3: {}
                }
              }
            },

            on: {
              NEXT: ".bar2.bar3"
            }
          }
        }
      }"
    `);
  });

  it('should use a sibling-like target when adding a transition to a deep descendant from a nested state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            initial: 'foo',
            states: {
              foo: {},
              bar: {
                states: {
                  bar2: {
                    states: {
                      bar3: {}
                    }
                  }
                }
              }
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['a', 'foo'],
          targetPath: ['a', 'bar', 'bar2', 'bar3'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            initial: 'foo',
            states: {
              foo: {
                on: {
                  NEXT: "bar.bar2.bar3"
                }
              },
              bar: {
                states: {
                  bar2: {
                    states: {
                      bar3: {}
                    }
                  }
                }
              }
            }
          }
        }
      }"
    `);
  });

  it('should use an ID-based target when adding a transition to a distant state (root implicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {}
            }
          },
          b: {
            initial: 'foo',
            states: {
              foo: {},
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['a', 'a1'],
          targetPath: ['b', 'foo'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {
                on: {
                  NEXT: "#(machine).b.foo"
                }
              }
            }
          },
          b: {
            initial: 'foo',
            states: {
              foo: {},
            }
          }
        }
      }"
    `);
  });

  it('should use an ID-based target when adding a transition to a distant state (root explicit ID)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'groot',
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {}
            }
          },
          b: {
            initial: 'foo',
            states: {
              foo: {},
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['a', 'a1'],
          targetPath: ['b', 'foo'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'groot',
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {
                on: {
                  NEXT: "#groot.b.foo"
                }
              }
            }
          },
          b: {
            initial: 'foo',
            states: {
              foo: {},
            }
          }
        }
      }"
    `);
  });

  it(`should use target's ID when available and when adding a transition to a distant state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'groot',
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {}
            }
          },
          b: {
            initial: 'foo',
            states: {
              foo: {
                id: 'bullseye'
              },
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['a', 'a1'],
          targetPath: ['b', 'foo'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'groot',
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {
                on: {
                  NEXT: "#bullseye"
                }
              }
            }
          },
          b: {
            initial: 'foo',
            states: {
              foo: {
                id: 'bullseye'
              },
            }
          }
        }
      }"
    `);
  });

  it(`should use the closest available ID from the target's ancestry path when adding a transition to a distant state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'groot',
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {}
            }
          },
          b: {
            id: 'bullseye',
            initial: 'foo',
            states: {
              foo: {},
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['a', 'a1'],
          targetPath: ['b', 'foo'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'groot',
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {
                on: {
                  NEXT: "#bullseye.foo"
                }
              }
            }
          },
          b: {
            id: 'bullseye',
            initial: 'foo',
            states: {
              foo: {},
            }
          }
        }
      }"
    `);
  });

  it('should be possible to add an external transition with a guard', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
          guard: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: {
                cond: "isItTooLate",
                target: "bar"
              }
            }
          },
          bar: {}
        }
      }"
    `);
  });

  it('should be possible to add an internal transition with a guard', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: ['bar'],
          transitionPath: ['on', 'NEXT', 0],
          external: false,
          guard: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',

        states: {
          foo: {},
          bar: {}
        },

        on: {
          NEXT: {
            cond: "isItTooLate",
            target: ".bar"
          }
        }
      }"
    `);
  });

  it('should be possible to add an external transition to a child with a guard', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: [],
          targetPath: ['bar'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
          guard: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',

        states: {
          foo: {},
          bar: {}
        },

        on: {
          NEXT: {
            cond: "isItTooLate",
            target: ".bar",
            internal: false
          }
        }
      }"
    `);
  });

  it('should be possible to add a targetless transition with a guard', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: null,
          transitionPath: ['on', 'NEXT', 0],
          external: true,
          guard: 'isItTooLate',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: {
                cond: "isItTooLate"
              }
            }
          },
        }
      }"
    `);
  });
});
