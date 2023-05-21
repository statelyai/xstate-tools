import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('edit_guard', () => {
  it('should be possible to update a guard name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            guard: 'isItTooLate',
            actions: 'callDavid'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_guard',
          path: [],
          transitionPath: ['on', 'CALL_HIM_MAYBE', 0],
          name: 'isHeAwake',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: {
            guard: "isHeAwake",
            actions: 'callDavid'
          }
        }
      }"
    `);
  });

  it('should be possible to update a parametrized guard name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            guard: { type: 'isItTooLate', time: '9am' },
            actions: 'callDavid'
          }
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_guard',
          path: [],
          transitionPath: ['on', 'CALL_HIM_MAYBE', 0],
          name: 'isHeAwake',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: {
            guard: { type: "isHeAwake", time: '9am' },
            actions: 'callDavid'
          }
        }
      }"
    `);
  });
});
