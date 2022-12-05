import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('reparent_state', () => {
  it('should be possible to move a state to a sibling of the parent', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {}
            }
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            states: {
              a1: {}
            }
          }
        }
      }"
    `);
  });

  it('should be possible to move a state to a sibling', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {},
              a2: {}
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['a', 'a2'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            states: {
              a2: {
                states: {
                  a1: {}
                }
              }
            }
          },
        }
      }"
    `);
  });

  it('should be possible to move to a new parent that already has some states', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {},
            }
          },
          b: {
            states: {
              b1: {}
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            states: {
              b1: {},
              a1: {}
            }
          }
        }
      }"
    `);
  });

  it('should keep other states when moving a a child state out of the old parent', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {},
          b: {
            states: {
              b1: {},
              b2: {},
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['b', 'b1'],
          newParentPath: ['a'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            states: {
              b1: {}
            }
          },
          b: {
            states: {
              b2: {}
            }
          }
        }
      }"
    `);
  });

  it(`should update the transition target on the ancestor of the state that got moved to the ancestor's sibling`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              FOO: '.a1'
            },
            states: {
              a1: {}
            }
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              FOO: "b.a1"
            }
          },
          b: {
            states: {
              a1: {}
            }
          }
        }
      }"
    `);
  });

  it(`should update the transition target on the ancestor of the state that got moved to the ancestors sibling's descendant`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              FOO: '.a1'
            },
            states: {
              a1: {}
            }
          },
          b: {
            states: {
              b1: {}
            }
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b', 'b1'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              FOO: "b.b1.a1"
            }
          },
          b: {
            states: {
              b1: {
                states: {
                  a1: {}
                }
              }
            }
          }
        }
      }"
    `);
  });

  it(`should update the transition target to the ID-based one when moving the state away from the source`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {
                on: {
                  FOO: '.a2'
                },
                states: {
                  a2: {}
                }
              }
            }
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1', 'a2'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            states: {
              a1: {
                on: {
                  FOO: "#(machine).b.a2"
                }
              }
            }
          },
          b: {
            states: {
              a2: {}
            }
          }
        }
      }"
    `);
  });

  it(`should not touch the target of the external self-transition on the reparented state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {
                id: 'bullseye',
                on: {
                  FOO: '#bullseye'
                }
              }
            }
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            states: {
              a1: {
                id: 'bullseye',
                on: {
                  FOO: '#bullseye'
                }
              }
            }
          }
        }
      }"
    `);
  });

  it(`should keep the ID-based target that targets state outside of the reparented state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {
                on: {
                  FOO: '#bullseye'
                }
              },
            }
          },
          b: {},
          c: {
            id: 'bullseye',
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            states: {
              a1: {
                on: {
                  FOO: '#bullseye'
                }
              }
            }
          },
          c: {
            id: 'bullseye',
          }
        }
      }"
    `);
  });

  it(`should update the sibling target that "escapes" the reparented state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {
                on: {
                  FOO: 'a2'
                }
              },
              a2: {}
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            states: {
              a2: {}
            }
          },
          b: {
            states: {
              a1: {
                on: {
                  FOO: "#(machine).a.a2"
                }
              }
            }
          },
        }
      }"
    `);
  });

  it(`should keep the sibling transition target that targets a state within the reparented state `, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {
                on: {
                  FOO: 'a2'
                }
              },
              a2: {}
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          b: {
            states: {
              a: {
                states: {
                  a1: {
                    on: {
                      FOO: 'a2'
                    }
                  },
                  a2: {}
                }
              }
            }
          }
        }
      }"
    `);
  });

  it(`should update the ID-based target with relative segments on a transition within the reparented state that targets a state in the reparented state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            // if we wouldn't update the target relying on this ID when moving that transition outside of this ancestor
            // then we'd end up with a bug because the new location of the target doesn't lie within the tree with this ID
            id: 'bullseye',
            states: {
              a1: {
                on: {
                  FOO: '#bullseye.a1.a2'
                },
                states: {
                  a2: {}
                }
              },
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            // if we wouldn't update the target relying on this ID when moving that transition outside of this ancestor
            // then we'd end up with a bug because the new location of the target doesn't lie within the tree with this ID
            id: 'bullseye'
          },
          b: {
            states: {
              a1: {
                on: {
                  FOO: "a2"
                },
                states: {
                  a2: {}
                }
              }
            }
          },
        }
      }"
    `);
  });

  it(`should update a transition target on a transition defined outside of the reparented state that targets a state in the reparented state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {},
              a2: {
                on: {
                  FOO: 'a1'
                }
              }
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            states: {
              a2: {
                on: {
                  FOO: "#(machine).b.a1"
                }
              }
            }
          },
          b: {
            states: {
              a1: {}
            }
          },
        }
      }"
    `);
  });

  it(`should remove the initial property if it was pointing to the reparented child state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {},
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            states: {
              a1: {}
            }
          },
        }
      }"
    `);
  });

  it(`should keep the initial property if it was not pointing to the reparented child state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {},
              a2: {},
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a2'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {}
            }
          },
          b: {
            states: {
              a2: {}
            }
          },
        }
      }"
    `);
  });

  it(`should be possible to move a state to the root`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            states: {
              a1: {},
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a', 'a1'],
          newParentPath: [],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          a1: {}
        }
      }"
    `);
  });

  it(`should update the target descriptor correctly when moving a state to lie within the target`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              FOO: 'b'
            }
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reparent_state',
          path: ['a'],
          newParentPath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          b: {
            states: {
              a: {
                on: {
                  FOO: "#(machine).b"
                }
              }
            }
          }
        }
      }"
    `);
  });
});
