import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('set_state_type', () => {
  it(`should be possible to set state's type to final`, () => {
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
          type: 'set_state_type',
          path: ['b'],
          stateType: 'final',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "final"
          },
        }
      }"
    `);
  });

  it(`should be possible to set state's type to parallel`, () => {
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
          type: 'set_state_type',
          path: ['b'],
          stateType: 'parallel',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "parallel"
          },
        }
      }"
    `);
  });

  it(`should be possible to set state's type to shallow history (implicit)`, () => {
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
          type: 'set_state_type',
          path: ['b'],
          stateType: 'history',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "history"
          },
        }
      }"
    `);
  });

  it(`should be possible to set state's type to shallow history (explicit)`, () => {
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
          type: 'set_state_type',
          path: ['b'],
          stateType: 'history',
          history: 'shallow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "history"
          },
        }
      }"
    `);
  });

  it(`should be possible to set state's type to deep history`, () => {
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
          type: 'set_state_type',
          path: ['b'],
          stateType: 'history',
          history: 'deep',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "history",
            history: "deep"
          },
        }
      }"
    `);
  });

  it(`should be possible to set state's type to normal when it's already implicitly normal`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_type',
          path: ['a'],
          stateType: 'normal',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {},
        }
      }"
    `);
  });

  it(`should be possible to set state's type to normal when it is of a different type`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: 'final'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_type',
          path: ['b'],
          stateType: 'normal',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {}
        }
      }"
    `);
  });

  it(`should be possible to set state's type to normal when it is a deep history state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: 'history',
            history: 'deep'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_type',
          path: ['b'],
          stateType: 'normal',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {}
        }
      }"
    `);
  });

  it(`should be possible to set state's type to parallel when it is a deep history state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: 'history',
            history: 'deep'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_type',
          path: ['b'],
          stateType: 'parallel',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "parallel"
          }
        }
      }"
    `);
  });

  it(`should be possible to set state's type to final when it is a deep history state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: 'history',
            history: 'deep'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_type',
          path: ['b'],
          stateType: 'final',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {
            type: "final"
          }
        }
      }"
    `);
  });
});
