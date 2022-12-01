import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('batched edits', () => {
  it('should be possible add a state and a transition targeting it', () => {
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
          type: 'add_state',
          path: [],
          name: 'bar',
        },

        {
          type: 'add_transition',
          sourcePath: ['foo'],
          targetPath: ['bar'],
          transitionPath: ['on', 'FOO', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          foo: {
            on: {
              FOO: "bar"
            }
          },

          bar: {}
        }
      }"
    `);
  });

  it('should be possible to remove a transition targeting a state that is being removed as well', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: {
              NEXT: 'active',
            }
          },
          active: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['idle'],
          transitionPath: ['on', 'NEXT', 0],
        },

        {
          type: 'remove_state',
          path: ['active'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'idle',
        states: {
          idle: {}
        }
      }"
    `);
  });

  it('should be possible to remove a transition with a source that is being removed as well', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'idle',
        states: {
          idle: {
            on: {
              NEXT: 'active',
            }
          },
          active: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_transition',
          sourcePath: ['idle'],
          transitionPath: ['on', 'NEXT', 0],
        },

        {
          type: 'remove_state',
          path: ['idle'],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'idle',
        states: {
          active: {}
        }
      }"
    `);
  });
});
