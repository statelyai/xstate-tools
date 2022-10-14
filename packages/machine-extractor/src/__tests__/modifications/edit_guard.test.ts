import outdent from 'outdent';
import { parseMachinesFromFile } from '../../parseMachinesFromFile';

const getModifiableMachine = (code: string) =>
  parseMachinesFromFile(outdent.string(code)).machines[0];

describe('edit_guard', () => {
  it('should be possible to update a guard name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            cond: 'isItTooLate',
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
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: {
            cond: "isHeAwake",
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
            cond: { type: 'isItTooLate', time: '9am' },
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
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: {
            cond: { type: "isHeAwake", time: '9am' },
            actions: 'callDavid'
          }
        }
      }"
    `);
  });
});
