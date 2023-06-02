import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('change_transition_path', () => {
  it('should be able to change the event name', () => {
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
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newTransitionPath: ['on', 'NEW', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEW: 'b'
            }
          },
          b: {},
        }
      }"
    `);
  });

  it('should be able to change the event name of a guarded transition', () => {
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
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newTransitionPath: ['on', 'NEW', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEW: {
                target: 'b',
                cond: 'isItTooLate'
              }
            }
          },
          b: {},
        }
      }"
    `);
  });

  it('should be able to convert the transitions to an always transition', () => {
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
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newTransitionPath: ['always', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            always: 'b'
          },
          b: {},
        }
      }"
    `);
  });

  it(`should be able to convert invoke's onDone to the same invoke's onError`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            invoke: {
              src: 'somethingTrulySpecial',
              onDone: 'b'
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['invoke', 0, 'onDone', 0],
          newTransitionPath: ['invoke', 0, 'onError', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            invoke: {
              src: 'somethingTrulySpecial',
              onError: 'b'
            }
          },
          b: {},
        }
      }"
    `);
  });

  it(`should be able to move transition from one invoke to another`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            invoke: [{
              src: 'somethingTrulySpecial',
              onDone: 'b'
            }, {
              src: 'topSecret',
            }]
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['invoke', 0, 'onDone', 0],
          newTransitionPath: ['invoke', 1, 'onDone', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            invoke: [{
              src: 'somethingTrulySpecial'
            }, {
              src: 'topSecret',
              onDone: 'b'
            }]
          },
          b: {},
        }
      }"
    `);
  });

  it('should be able to move transition to the end of the existing event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b',
              OTHER: 'c',
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
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'OTHER', 0],
          newTransitionPath: ['on', 'NEXT', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ['b', 'c']
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should be able to move transition to the start of the existing event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b',
              OTHER: 'c',
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
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'OTHER', 0],
          newTransitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ['c', 'b']
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should be able to move transition to the middle of the existing event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ['b', 'd'],
              OTHER: 'c',
            }
          },
          b: {},
          c: {},
          d: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'OTHER', 0],
          newTransitionPath: ['on', 'NEXT', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ['b', 'c', 'd']
            }
          },
          b: {},
          c: {},
          d: {},
        }
      }"
    `);
  });

  it('should be able to move transition out of an array group to a new event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: ['b', 'c'],
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
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newTransitionPath: ['on', 'OTHER', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'c',
              OTHER: 'b'
            }
          },
          b: {},
          c: {},
        }
      }"
    `);
  });

  it('should keep the transition when renaming the event to an empty string', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: "b",
            }
          },
          b: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'change_transition_path',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          newTransitionPath: ['on', '', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              "": "b"
            }
          },
          b: {},
        }
      }"
    `);
  });
});
