import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) => {
  const modifiable = extractMachinesFromFile(outdent.string(code))!
    .machines[0]!;

  const original = modifiable.modify;
  modifiable.modify = function (edits) {
    return original.call(modifiable, edits, { v5: true });
  };

  return modifiable;
};

describe('mark_transition_as_external v5', () => {
  it('should be possible to mark a transition as reentering', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: '.a1'
            },
            states: {
              a1: {}
            }
          }
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'mark_transition_as_external',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          external: true,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                reenter: true
              }
            },
            states: {
              a1: {}
            }
          }
        }
      }"
    `);
  });

  it('should be possible to mark a transition as non-reentering', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                reenter: true
              }
            },
            states: {
              a1: {}
            }
          }
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'mark_transition_as_external',
          sourcePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          external: false,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              NEXT: '.a1'
            },
            states: {
              a1: {}
            }
          }
        }
      }"
    `);
  });
});
