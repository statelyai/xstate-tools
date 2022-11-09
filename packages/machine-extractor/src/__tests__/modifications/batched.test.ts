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
      ]).newText,
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
});
