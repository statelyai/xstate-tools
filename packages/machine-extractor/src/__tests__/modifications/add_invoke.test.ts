import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('add_invoke', () => {
  it('should be possible to add an invoke to the root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: [],
          invokeIndex: 0,
          source: 'callDavid',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: "callDavid"
        }
      }"
    `);
  });

  it('should be possible to add an invoke to a nested state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          FOO: 'a'
        },
        states: {
          a: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: ['a'],
          invokeIndex: 0,
          source: 'callDavid',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          FOO: 'a'
        },
        states: {
          a: {
            invoke: {
              src: "callDavid"
            }
          }
        }
      }"
    `);
  });

  it('should be possible to add an invoke with an ID', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: [],
          invokeIndex: 0,
          source: 'callDavid',
          id: 'importantCall',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: "callDavid",
          id: "importantCall"
        }
      }"
    `);
  });

  it('should be possible to add a new invoke to an existing invoke property', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'callDavid'
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: [],
          invokeIndex: 1,
          source: 'getRaise',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: [{
          src: 'callDavid'
        }, {
          src: "getRaise"
        }]
      }"
    `);
  });

  it('should be possible to add a new invoke at the start of the existing invoke list', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: [{
          src: 'miny'
        }, {
          src: 'moe'
        }]
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: [],
          invokeIndex: 0,
          source: 'eeny',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: [{
          src: "eeny"
        }, {
          src: 'miny'
        }, {
          src: 'moe'
        }]
      }"
    `);
  });

  it('should be possible to add a new invoke in the middle of the existing invoke list', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: [{
          src: 'eeny'
        }, {
          src: 'moe'
        }]
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: [],
          invokeIndex: 1,
          source: 'miny',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: [{
          src: 'eeny'
        }, {
          src: "miny"
        }, {
          src: 'moe'
        }]
      }"
    `);
  });

  it('should be possible to add a new invoke at the end of the existing invoke list', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: [{
          src: 'eeny'
        }, {
          src: 'miny'
        }]
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_invoke',
          path: [],
          invokeIndex: 2,
          source: 'moe',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: [{
          src: 'eeny'
        }, {
          src: 'miny'
        }, {
          src: "moe"
        }]
      }"
    `);
  });
});
