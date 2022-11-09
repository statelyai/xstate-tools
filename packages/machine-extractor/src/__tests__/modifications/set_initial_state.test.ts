import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('set_initial_state', () => {
  it("should override root's existing initial state", () => {
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
          type: 'set_initial_state',
          path: [],
          initialState: 'bar',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: "bar",
        states: {
          foo: {},
          bar: {},
        },
      }"
    `);
  });

  it("should override nested state's existing initial state", () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'foo',
        states: {
          foo: {
            initial: 'bar',
            states: {
              bar: {},
              baz: {},
            }
          },
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_initial_state',
          path: ['foo'],
          initialState: 'baz',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'foo',
        states: {
          foo: {
            initial: "baz",
            states: {
              bar: {},
              baz: {},
            }
          },
        },
      }"
    `);
  });

  it('should add initial state to root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
          bar: {},
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_initial_state',
          path: [],
          initialState: 'bar',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          foo: {},
          bar: {},
        },

        initial: "bar"
      }"
    `);
  });
});
