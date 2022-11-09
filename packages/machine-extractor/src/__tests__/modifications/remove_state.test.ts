import outdent from 'outdent';
import { parseMachinesFromFile } from '../../parseMachinesFromFile';

const getModifiableMachine = (code: string) =>
  parseMachinesFromFile(outdent.string(code)).machines[0];

describe('remove_state', () => {
  it('should be possible to remove a state of a given path', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it('should remove the parent `states` property if removing the state empties that object', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`"createMachine({})"`);
  });

  it('should remove a sibling transition targeting the removed state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: 'foo',
              OTHER: 'baz'
            }
          },
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {
            on: {
              OTHER: 'baz'
            }
          },

          baz: {}
        }
      })"
    `);
  });

  it('should remove a transition to a child targeting the removed state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          NEXT: '.foo',
          OTHER: '.baz'
        },
        states: {
          foo: {},
          bar: {},
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        on: {
          OTHER: '.baz'
        },
        states: {
          bar: {},
          baz: {}
        }
      })"
    `);
  });

  it('should remove a transition targeting the ID of the removed state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {
            on: {
              NEXT: '#bullseye',
              OTHER: 'baz'
            },
          },
          bar: {
            id: 'bullseye'
          },
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['bar'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          foo: {
            on: {
              OTHER: 'baz'
            },
          },

          baz: {}
        }
      })"
    `);
  });

  it('should remove the emptied `on` when removing a transition targeting the removed state (simple target)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: 'foo',
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it('should remove the emptied `on` when removing a transition targeting the removed state (target in an object)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: {
                target: 'foo'
              },
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it('should remove the emptied `on` when removing a transition targeting the removed state (simple target in an array)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: {
                target: ['foo']
              },
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it('should remove the emptied `on` when removing a transition targeting the removed state (target in an object in an array)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: [{
                target: 'foo'
              }],
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it('should keep `on` when removing transitions for a different event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: 'foo',
              OTHER: 'baz',
            }
          },
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {
            on: {
              OTHER: 'baz'
            }
          },

          baz: {}
        }
      })"
    `);
  });

  it('should keep in array transitions going to other states than the removed one', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            on: {
              NEXT: ['foo', 'baz'],
            }
          },
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {
            on: {
              NEXT: 'baz',
            }
          },

          baz: {}
        }
      })"
    `);
  });

  it('should remove the always transition when removing a transition targeting the removed state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            always: 'foo'
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it(`should remove the state's onDone transition when removing a transition targeting the removed state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            onDone: 'foo'
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it(`should remove the invoke's onDone transition when removing a transition targeting the removed state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            invoke: {
              src: () => () => {},
              onDone: 'foo'
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {
            invoke: {
              src: () => () => {}
            }
          }
        }
      })"
    `);
  });

  it(`should remove an after transition when removing a transition targeting the removed state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {
            after: {
              1000: 'foo'
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {}
        }
      })"
    `);
  });

  it(`should remove transitions targeting descendants states of the removed state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {
            initial: 'foo1',
            states: {
              foo1: {},
            }
          },
          bar: {
            on: {
              NEXT: 'foo.foo1',
              OTHER: 'baz'
            }
          },
          baz: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_state',
          path: ['foo'],
        },
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          bar: {
            on: {
              OTHER: 'baz'
            }
          },

          baz: {}
        }
      })"
    `);
  });
});
