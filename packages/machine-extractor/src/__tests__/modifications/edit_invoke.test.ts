import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('edit_invoke', () => {
  it(`should be possible to update invoke's source`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          source: 'callAn(d)e(r)s',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: "callAn(d)e(r)s"
        },
      }"
    `);
  });

  it(`should be possible to add an ID to the existing invoke`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid',
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          id: 'importantCall',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: 'callDavid',
          id: "importantCall"
        },
      }"
    `);
  });

  it(`should be possible to update invoke's ID`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid',
          id: 'importantCall'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          id: 'veryImportantCall',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: 'callDavid',
          id: "veryImportantCall"
        },
      }"
    `);
  });

  it(`should be possible to update invoke's source and ID at the same time`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid',
          id: 'importantCall'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          source: 'callAn(d)e(r)s',
          id: 'veryImportantCall',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: "callAn(d)e(r)s",
          id: "veryImportantCall"
        },
      }"
    `);
  });

  it(`should be possible to remove invoke's ID`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid',
          id: 'importantCall'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          id: null,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: 'callDavid'
        },
      }"
    `);
  });

  it(`should remove all \`id\` props when removing invoke's ID`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid',
          id: 'importantCall',
          id: 'veryImportantCall'
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          id: null,
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: 'callDavid'
        },
      }"
    `);
  });

  it(`should be possible to update parametrized invoke's source`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: {
            type: 'callDavid',
            at: 'noon'
          }
        },
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 0,
          source: 'callAn(d)e(r)s',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: {
            type: "callAn(d)e(r)s",
            at: 'noon'
          }
        },
      }"
    `);
  });

  it(`should be possible to update nth invoke's source`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: [{
          src: 'callDavid'
        }, {
          src: 'callAnders'
        }],
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'edit_invoke',
          path: [],
          invokeIndex: 1,
          source: 'callAn(d)e(r)s',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: [{
          src: 'callDavid'
        }, {
          src: "callAn(d)e(r)s"
        }],
      }"
    `);
  });
});
