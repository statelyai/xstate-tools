import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('set_state_id', () => {
  it(`should be possible to set nested state's id`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_id',
          path: ['a'],
          id: 'TEST_ID',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            id: "TEST_ID"
          },
        }
      }"
    `);
  });

  it(`should be possible to set root's id`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_id',
          path: [],
          id: 'TEST_ID',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',

        states: {
          a: {},
        },

        id: "TEST_ID"
      }"
    `);
  });

  it(`should be possible to update nested state's id`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            id: 'preexisting'
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_id',
          path: ['a'],
          id: 'TEST_ID',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {
            id: "TEST_ID"
          },
        }
      }"
    `);
  });

  it(`should be possible to update root's id`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'preexisting',
        initial: 'a',
        states: {
          a: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_id',
          path: [],
          id: 'TEST_ID',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        id: "TEST_ID",
        initial: 'a',
        states: {
          a: {},
        }
      }"
    `);
  });

  it(`should be possible to remove nested state's id`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        initial: 'a',
        states: {
          a: {
            id: 'preexisting'
          },
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_id',
          path: ['a'],
          id: null,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',
        states: {
          a: {},
        }
      }"
    `);
  });

  it(`should be possible to remove root's id`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        id: 'preexisting',
        initial: 'a',
        states: {
          a: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_state_id',
          path: [],
          id: null,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        initial: 'a',

        states: {
          a: {},
        }
      }"
    `);
  });
});
