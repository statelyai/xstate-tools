import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('rename_state', () => {
  it('should rename a state using identifier', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        type: 'parallel',
        states: {
          foo: {},
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['foo'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        type: 'parallel',
        states: {
          NEW_NAME: {},
          bar: {},
        },
      }"
    `);
  });

  it('should rename a state using string literal for not valid identifiers', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        type: 'parallel',
        states: {
          foo: {},
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['foo'],
          name: 'NOT A VALID IDENTIFIER',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        type: 'parallel',
        states: {
          "NOT A VALID IDENTIFIER": {},
          bar: {},
        },
      }"
    `);
  });

  it('should rename a state with escaped quotes', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        type: 'parallel',
        states: {
          foo: {},
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['foo'],
          name: `'oh my', "what's this?"`,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        type: 'parallel',
        states: {
          "'oh my', \\"what's this?\\"": {},
          bar: {},
        },
      }"
    `);
  });

  it('should adjust initial state of the parent when renaming a state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {},
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['foo'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: "NEW_NAME",
        states: {
          NEW_NAME: {},
          bar: {},
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a state (string)', () => {
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
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: "NEW_NAME",
            }
          },
          NEW_NAME: {},
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a state (object)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: 'bar' },
            }
          },
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "NEW_NAME" },
            }
          },
          NEW_NAME: {},
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a state (string in array)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: [{ target: 'baz' }, 'bar'],
            }
          },
          bar: {},
          baz: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: [{ target: 'baz' }, "NEW_NAME"],
            }
          },
          NEW_NAME: {},
          baz: {},
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a state (object in array)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: [{ target: 'baz' }, 'bar'],
            }
          },
          bar: {},
          baz: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['baz'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: [{ target: "NEW_NAME" }, 'bar'],
            }
          },
          bar: {},
          NEW_NAME: {},
        },
      }"
    `);
  });

  it('should adjust target in the parent state when renaming a state (string)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        on: {
          NEXT: '.baz',
        },
        states: {
          foo: {},
          bar: {},
          baz: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['baz'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        on: {
          NEXT: ".NEW_NAME",
        },
        states: {
          foo: {},
          bar: {},
          NEW_NAME: {},
        },
      }"
    `);
  });

  it('should leave untouched target in the parent that attempts to target its child without a leading dot', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        on: {
          NEXT: 'baz',
        },
        states: {
          foo: {},
          bar: {},
          baz: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['baz'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        on: {
          NEXT: 'baz',
        },
        states: {
          foo: {},
          bar: {},
          NEW_NAME: {},
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a nested state (trailing segment)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: 'bar.bar2' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "bar.NEW_NAME" },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {}
            }
          },
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a nested state (leading segment)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: 'bar.bar2' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "NEW_NAME.bar2" },
            }
          },
          NEW_NAME: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a nested state (segment in the middle)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: 'bar.bar2.bar4' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {
                states: {
                  bar4: {}
                }
              }
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "bar.NEW_NAME.bar4" },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {
                states: {
                  bar4: {}
                }
              }
            }
          },
        },
      }"
    `);
  });

  it('should adjust target in the ancestor state when renaming a nested state (trailing segment)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        on: {
          NEXT: { target: '.bar.bar2' },
        },
        states: {
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        on: {
          NEXT: { target: ".bar.NEW_NAME" },
        },
        states: {
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {}
            }
          },
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a nested state (leading segment)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        on: {
          NEXT: { target: '.bar.bar2' },
        },
        states: {
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        on: {
          NEXT: { target: ".NEW_NAME.bar2" },
        },
        states: {
          NEW_NAME: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      }"
    `);
  });

  it('should adjust target in the sibling state when renaming a nested state (segment in the middle)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        on: {
          NEXT: { target: '.bar.bar2.bar4' },
        },
        states: {
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {
                states: {
                  bar4: {}
                }
              }
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        on: {
          NEXT: { target: ".bar.NEW_NAME.bar4" },
        },
        states: {
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {
                states: {
                  bar4: {}
                }
              }
            }
          },
        },
      }"
    `);
  });

  it('should adjust ID-based target when renaming a state nested in that ID (trailing segment)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#bullseye.bar2' },
            }
          },
          bar: {
            id: 'bullseye',
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#bullseye.NEW_NAME" },
            }
          },
          bar: {
            id: 'bullseye',
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {}
            }
          },
        },
      }"
    `);
  });

  it('should adjust ID-based target when renaming a state nested in that ID (segment in the middle)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#bullseye.bar2.bar4' },
            },
          },
          bar: {
            id: 'bullseye',
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {
                states: {
                  bar4: {}
                }
              }
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#bullseye.NEW_NAME.bar4" },
            },
          },
          bar: {
            id: 'bullseye',
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {
                states: {
                  bar4: {}
                }
              }
            }
          },
        },
      }"
    `);
  });

  it('should leave untouched ID-based target with ID that matches the sibling key (no extra segments)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#bar' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
          baz: {
            id: 'bar'
          }
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#bar' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {}
            }
          },
          baz: {
            id: 'bar'
          }
        },
      }"
    `);
  });

  it('should leave untouched ID-based target with ID that matches the sibling key (nested segment)', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#bar.bar2' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              bar2: {}
            }
          },
          baz: {
            id: 'bar'
          }
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar', 'bar2'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#bar.bar2' },
            }
          },
          bar: {
            initial: 'bar1',
            states: {
              bar1: {},
              NEW_NAME: {}
            }
          },
          baz: {
            id: 'bar'
          }
        },
      }"
    `);
  });

  it(`should adjust ID-based target that uses root's explicit ID when renaming a state nested in that ID`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'branch',
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#branch.bar' },
            }
          },
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'branch',
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#branch.NEW_NAME" },
            }
          },
          NEW_NAME: {},
        },
      }"
    `);
  });

  it(`should adjust ID-based target that uses root's implicit ID when renaming a state nested in that ID`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#(machine).bar' },
            }
          },
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#(machine).NEW_NAME" },
            }
          },
          NEW_NAME: {},
        },
      }"
    `);
  });

  it(`should leave untouched ID-based target that uses root's implicit ID when the root has an explicit ID`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'branch',
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#(machine).bar' },
            }
          },
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'branch',
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '#(machine).bar' },
            }
          },
          NEW_NAME: {},
        },
      }"
    `);
  });

  it(`should successfully rename state that has an empty key`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'branch',
        initial: '',
        states: {
          '': {
            on: {
              NEXT: { target: '#(machine).bar' },
            }
          },
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: [''],
          name: 'NEW_NAME',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: 'branch',
        initial: "NEW_NAME",
        states: {
          NEW_NAME: {
            on: {
              NEXT: { target: '#(machine).bar' },
            }
          },
          bar: {},
        },
      }"
    `);
  });

  it(`should successfully rename a targeted state to an empty key`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: 'bar' },
            }
          },
          bar: {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: '',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#(machine)." },
            }
          },
          "": {},
        },
      }"
    `);
  });

  it(`should successfully rename a targeted state with an empty key`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: '' },
            }
          },
          '': {},
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: [''],
          name: 'bar',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "bar" },
            }
          },
          bar: {},
        },
      }"
    `);
  });

  it(`should successfully rename a state with a targeted child to an empty key`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: 'bar.child' },
            }
          },
          bar: {
            states: {
              child: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['bar'],
          name: '',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#(machine)..child" },
            }
          },
          "": {
            states: {
              child: {}
            }
          },
        },
      }"
    `);
  });

  it(`should successfully rename a targeted state within a state with an empty key`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#(machine)..child" },
            }
          },
          "": {
            states: {
              child: {}
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: [''],
          name: 'bar',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: { target: "#(machine).bar.child" },
            }
          },
          bar: {
            states: {
              child: {}
            }
          },
        },
      }"
    `);
  });

  it(`should successfully update the target descriptor of a self-transition of the renamed state`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            on: {
              NEXT: "foo"
            }
          },
        },
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'rename_state',
          path: ['foo'],
          name: 'wow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: "wow",
        states: {
          wow: {
            on: {
              NEXT: "wow"
            }
          },
        },
      }"
    `);
  });
});
