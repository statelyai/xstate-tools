import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('mark_transition_as_external', () => {
  it('should be possible to mark a transition as external', () => {
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
                internal: false
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

  it('should be possible to mark a transition as internal', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: '.a1',
                internal: false
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
