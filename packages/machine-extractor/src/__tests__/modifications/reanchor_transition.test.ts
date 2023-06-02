import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('reanchor_transition', () => {
  it('should be possible to change a simple target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "c"
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should be possible to change a target in an object transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                actions: ['foo']
              }
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: "c",
                actions: ['foo']
              }
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should minify the object transition if it only has a target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
              }
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "c"
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should minify a single simple target-only transition in an array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ['b']
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "c"
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should minify a single object transition in an array if it only has a target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: [{
                target: 'b',
              }]
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "c"
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should change an inferred internal target to an external one when targeting state outside of the source', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: '.a1'
            },
            states: {
              a1: {}
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "c"
            },
            states: {
              a1: {}
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should remove an explicit internal property when targeting state outside of the source', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                internal: true
              }
            },
            states: {
              a1: {}
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "c"
            },
            states: {
              a1: {}
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should remove an explicit internal property when targeting state outside of the source (guarded transition)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                cond: 'isTooLate',
                internal: true
              }
            },
            states: {
              a1: {}
            }
          },
          b: {},
          c: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['c'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: "c",
                cond: 'isTooLate'
              }
            },
            states: {
              a1: {}
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should preserve external transition type when retargeting to another descendant', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                internal: false
              }
            },
            states: {
              a1: {},
              a2: {},
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a', 'a2'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: ".a2",
                internal: false
              }
            },
            states: {
              a1: {},
              a2: {},
            }
          },
        }
      }"
    `);
  });

  it('should remove an explicit internal property type when retargeting to self', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                internal: false
              }
            },
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "a"
            },
          },
        }
      }"
    `);
  });

  it('should remove an explicit internal property type when retargeting to self (guarded transition)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                cond: 'isTooLate',
                internal: false
              }
            },
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: "a",
                cond: 'isTooLate'
              }
            },
          },
        }
      }"
    `);
  });

  it('should add an explicit internal property type when retargeting internal transition to self from a descendant', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: '.a1'
            },
            initial: 'a1',
            states: {
              a1: {}
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: "a",
                internal: true
              }
            },
            initial: 'a1',
            states: {
              a1: {}
            }
          },
        }
      }"
    `);
  });

  it('should remove an explicit internal property type when retargeting external transition to self from a descendant', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                internal: false
              }
            },
            initial: 'a1',
            states: {
              a1: {}
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "a"
            },
            initial: 'a1',
            states: {
              a1: {}
            }
          },
        }
      }"
    `);
  });

  it('should be possible to make a transition targetless', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'a'
            },
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: null,
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: undefined
            },
          },
        }
      }"
    `);
  });

  it('should be possible to make a guarded transition targetless', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: 'a',
                cond: 'isTooLate'
              }
            },
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: null,
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                cond: 'isTooLate'
              }
            },
          },
        }
      }"
    `);
  });

  it('should be possible to add a target to a targetless transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: undefined
            },
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: "a",
                internal: true
              }
            },
          },
        }
      }"
    `);
  });

  it('should be possible to add a target to a guarded targetless transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                cond: 'isTooLate'
              }
            },
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                cond: 'isTooLate',
                target: "a",
                internal: true
              }
            },
          },
        }
      }"
    `);
  });

  it('should ignore explicit internal prop on a transition targeting state outside of the source when retargeting a transition to self', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                internal: false
              }
            },
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: "a",
                internal: true
              }
            },
          },
          b: {}
        }
      }"
    `);
  });

  it('should ignore explicit internal prop on a transition targeting state outside of the source when retargeting a transition to a descendant', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                internal: false
              }
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
          type: 'reanchor_transition',
          sourcePath: ['a'],
          newTargetPath: ['a', 'a1'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ".a1"
            },
            states: {
              a1: {}
            }
          },
          b: {}
        }
      }"
    `);
  });

  it('should be possible to change the source of a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            },
          },
          b: {},
          c: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['c'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {},
          b: {},
          c: {
            on: {
              NEXT: "b"
            }
          }
        }
      }"
    `);
  });

  it('should be possible to change the source of a guarded transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                cond: 'isItTooLate'
              }
            },
          },
          b: {},
          c: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['c'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {},
          b: {},
          c: {
            on: {
              NEXT: {
                target: "b",
                cond: 'isItTooLate'
              }
            }
          }
        }
      }"
    `);
  });

  it('should make the transition internal when changing the source to be an ancestor of the target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {
                on: {
                  NEXT: 'a2'
                }
              },
              a2: {}
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a', 'a1'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['a'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            initial: 'a1',

            states: {
              a1: {},
              a2: {}
            },

            on: {
              NEXT: ".a2"
            }
          },
        }
      }"
    `);
  });

  it('should change the external transition to be internal when changing the source to an ancestor of the target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            initial: 'a1',
            states: {
              a1: {
                on: {
                  NEXT: 'a2'
                }
              },
              a2: {}
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a', 'a1'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['a'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            initial: 'a1',

            states: {
              a1: {},
              a2: {}
            },

            on: {
              NEXT: ".a2"
            }
          },
        }
      }"
    `);
  });

  it(`should keep the transition as internal when reanchoring internal transition's source to self`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: '.a2'
            },
            initial: 'a1',
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
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['a', 'a2'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            initial: 'a1',

            states: {
              a1: {},
              a2: {
                on: {
                  NEXT: {
                    target: "a2",
                    internal: true
                  }
                }
              }
            }
          },
        }
      }"
    `);
  });

  it(`should change the external transition to be internal when reanchoring external transition's source to self`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a2',
                internal: false
              }
            },
            initial: 'a1',
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
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['a', 'a2'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            initial: 'a1',

            states: {
              a1: {},
              a2: {
                on: {
                  NEXT: {
                    target: "a2",
                    internal: true
                  }
                }
              }
            }
          },
        }
      }"
    `);
  });

  it('should be possible to change the source of a sibling transition to a descandant of the original source', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
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
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['a', 'a1'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            states: {
              a1: {
                on: {
                  NEXT: "#(machine).b"
                }
              }
            }
          },
          b: {}
        }
      }"
    `);
  });

  it('should change the external transition to be internal when changing the source to be a closer ancestor of the target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        on: {
          NEXT: {
            target: '.a.a2',
            internal: false
          }
        },
        states: {
          a: {
            initial: 'a1',
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
          type: 'reanchor_transition',
          sourcePath: [],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['a'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',

        states: {
          a: {
            initial: 'a1',

            states: {
              a1: {},
              a2: {}
            },

            on: {
              NEXT: ".a2"
            }
          },
        }
      }"
    `);
  });

  it('should be possible to swap source and target', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            },
          },
          b: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['b'],
          newTargetPath: ['a'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {},
          b: {
            on: {
              NEXT: "a"
            }
          }
        }
      }"
    `);
  });

  it('should be possible to append invoke.onDone transition to existing invoke on another state when changing source', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            invoke: {
              src: 'callDavid',
              onDone: 'c'
            },
          },
          b: {
            invoke: {
              src: 'callDavid',
              onDone: 'd'
            },
          },
          c: {},
          d: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['invoke', 0, 'onDone', 0],
          newSourcePath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            invoke: {
              src: 'callDavid'
            },
          },
          b: {
            invoke: {
              src: 'callDavid',
              onDone: ['d', "c"]
            },
          },
          c: {},
          d: {}
        }
      }"
    `);
  });

  it('should be possible to append a transition to existing `on` for an event with an empty name when changing source', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              '': 'c'
            }
          },
          b: {
            on: {
              '': 'd'
            }
          },
          c: {},
          d: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', '', 0],
          newSourcePath: ['b'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            on: {
              '': ['d', "c"]
            }
          },
          c: {},
          d: {},
        }
      }"
    `);
  });

  it('should be possible to insert a transition at the desired transition path within a target group', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: 'c'
            }
          },
          b: {
            on: {
              NEXT: ['d', 'e']
            }
          },
          c: {},
          d: {},
          e: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['b'],
          newTransitionPath: ['on', 'NEXT', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            on: {
              NEXT: ['d', "c", 'e']
            }
          },
          c: {},
          d: {},
          e: {},
        }
      }"
    `);
  });

  it('should be possible to append a transition at the desired transition path in a simplified group', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: 'c'
            }
          },
          b: {
            on: {
              NEXT: 'd'
            }
          },
          c: {},
          d: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['b'],
          newTransitionPath: ['on', 'NEXT', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            on: {
              NEXT: ['d', "c"]
            }
          },
          c: {},
          d: {},
        }
      }"
    `);
  });

  it('should be possible to prepend a transition at the desired transition path in a simplified group', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: 'c'
            }
          },
          b: {
            on: {
              NEXT: 'd'
            }
          },
          c: {},
          d: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'reanchor_transition',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newSourcePath: ['b'],
          newTransitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {},
          b: {
            on: {
              NEXT: ["c", 'd']
            }
          },
          c: {},
          d: {},
        }
      }"
    `);
  });
});
