import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('edit_action', () => {
  it('should be possible to update a single entry action name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: 'callDavid',
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['entry', 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: "getRaise",
      }"
    `);
  });

  it('should be possible to update a single object entry action name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: {
          type: 'callDavid'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['entry', 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: {
          type: "getRaise"
        },
      }"
    `);
  });

  it('should be possible to update a single exit action name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        exit: 'callDavid',
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['exit', 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        exit: "getRaise",
      }"
    `);
  });

  it('should be possible to update a single object exit action name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        exit: {
          type: 'callDavid'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['exit', 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        exit: {
          type: "getRaise"
        },
      }"
    `);
  });

  it('should be possible to update entry action name in an array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: ['callDavid', 'getRaise'],
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['entry', 1],
          name: 'keepTheJob',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: ['callDavid', "keepTheJob"],
      }"
    `);
  });

  it('should be possible to update object entry action name in an array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: ['callDavid', { type: 'getRaise' }],
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['entry', 1],
          name: 'keepTheJob',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: ['callDavid', { type: "keepTheJob" }],
      }"
    `);
  });

  it('should be possible to update exit action name in an array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        exit: ['callDavid', 'getRaise'],
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['exit', 1],
          name: 'keepTheJob',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        exit: ['callDavid', "keepTheJob"],
      }"
    `);
  });

  it('should be possible to update object exit action name in an array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        exit: ['callDavid', { type: 'getRaise' }],
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['exit', 1],
          name: 'keepTheJob',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        exit: ['callDavid', { type: "keepTheJob" }],
      }"
    `);
  });

  it('should be possible to update a single transition action name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            actions: 'callDavid'
          }
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['on', 'CALL_HIM_MAYBE', 0, 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: {
            actions: "getRaise"
          }
        },
      }"
    `);
  });

  it('should be possible to update a single transition object action name', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            actions: { type: 'callDavid' }
          }
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['on', 'CALL_HIM_MAYBE', 0, 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: {
            actions: { type: "getRaise" }
          }
        },
      }"
    `);
  });

  it('should be possible to update an action name within the nth guarded transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: [{
            cond: 'isItTooLate'
          }, {
            actions: 'callDavid'
          }]
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_action',
          path: [],
          actionPath: ['on', 'CALL_HIM_MAYBE', 1, 0],
          name: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: [{
            cond: 'isItTooLate'
          }, {
            actions: "getRaise"
          }]
        },
      }"
    `);
  });
});
