import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('remove_transition', () => {
  it('should be possible to remove a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar',
              OTHER: 'baz',
            }
          },
          bar: {},
          baz: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              OTHER: 'baz'
            }
          },
          bar: {},
          baz: {},
        }
      }"
    `);
  });

  it('should remove the emptied `on` when removing a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar',
            }
          },
          bar: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {},
          bar: {},
        }
      }"
    `);
  });

  it('should remove a transition at the end of the existing array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', 'baz'],
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
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['on', 'NEXT', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'bar',
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it('should remove a transition at the start of the existing array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', 'baz'],
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
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: 'baz',
            }
          },
          bar: {},
          baz: {}
        }
      }"
    `);
  });

  it('should remove a transition in the middle of the existing array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', 'baz', 'qwe'],
            }
          },
          bar: {},
          baz: {},
          qwe: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['on', 'NEXT', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: ['bar', 'qwe'],
            }
          },
          bar: {},
          baz: {},
          qwe: {},
        }
      }"
    `);
  });

  it(`should remove an invoke's onDone transition`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService',
              onDone: 'bar'
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['invoke', 0, 'onDone', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService'
            }
          },
        }
      }"
    `);
  });

  it(`should remove an invoke's onError transition`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService',
              onError: 'bar'
            }
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['invoke', 0, 'onError', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: {
              src: 'someService'
            }
          },
        }
      }"
    `);
  });

  it(`should remove a transition from the last invoke's onDone`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'someOtherService',
              onDone: 'bar'
            }]
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['invoke', 1, 'onDone', 0],
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
              src: 'someOtherService'
            }]
          },
        }
      }"
    `);
  });

  it(`should remove a transition from the first invoke's onDone`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
              onDone: 'bar'
            }, {
              src: 'someOtherService',
            }]
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['invoke', 0, 'onDone', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService'
            }, {
              src: 'someOtherService',
            }]
          },
        }
      }"
    `);
  });

  it(`should remove a transition from a middle invoke's onDone`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            invoke: [{
              src: 'someService',
            }, {
              src: 'someOtherService',
              onDone: 'bar'
            }, {
              src: 'yetAnotherService',
            }]
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['foo'],
          transitionPath: ['invoke', 1, 'onDone', 0],
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
              src: 'someOtherService'
            }, {
              src: 'yetAnotherService',
            }]
          },
        }
      }"
    `);
  });
});
