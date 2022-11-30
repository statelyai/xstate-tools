import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('remove_action', () => {
  it('should be possible to remove a single entry action', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: 'callDavid'
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['entry', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`"{}"`);
  });

  it('should be possible to remove a single exit action', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        exit: 'callDavid'
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['exit', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`"{}"`);
  });

  it('should be possible to remove first entry action', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: ['callDavid', 'getRaise']
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['entry', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: ['getRaise']
      }"
    `);
  });

  it('should be possible to remove last entry action', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: ['callDavid', 'getRaise']
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['entry', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: ['callDavid']
      }"
    `);
  });

  it('should be possible to remove an entry action in the middle', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        entry: ['callDavid', 'eatSnacks', 'getRaise']
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['entry', 1],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        entry: ['callDavid', 'getRaise']
      }"
    `);
  });

  it('should be possible to remove a single transition action for an external event', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          CALL_HIM_MAYBE: {
            target: '.called',
            actions: 'callDavid'
          }
        },
        states: {
          called: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['on', 'CALL_HIM_MAYBE', 0, 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: '.called'
        },
        states: {
          called: {}
        }
      }"
    `);
  });

  it(`should be possible to remove an action from invoke's onDone`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid',
          onDone: {
            target: '.called',
            actions: 'getRaise'
          }
        },
        states: {
          called: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_action',
          path: [],
          actionPath: ['invoke', 0, 'onDone', 0, 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: 'callDavid',
          onDone: '.called'
        },
        states: {
          called: {}
        }
      }"
    `);
  });

  it('should be possible to remove an action from a targetless transition', () => {
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
          type: 'remove_action',
          path: [],
          actionPath: ['on', 'CALL_HIM_MAYBE', 0, 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          CALL_HIM_MAYBE: undefined
        },
      }"
    `);
  });
});
