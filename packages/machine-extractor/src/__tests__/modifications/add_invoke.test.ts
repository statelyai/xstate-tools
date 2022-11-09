import outdent from 'outdent';
import { parseMachinesFromFile } from '../../parseMachinesFromFile';

const getModifiableMachine = (code: string) =>
  parseMachinesFromFile(outdent.string(code)).machines[0];

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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        invoke: {
          src: "callDavid"
        }
      })"
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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
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
      })"
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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        invoke: {
          src: "callDavid",
          id: "importantCall"
        }
      })"
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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        invoke: [{
          src: 'callDavid'
        }, {
          src: "getRaise"
        }]
      })"
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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        invoke: [{
          src: "eeny"
        }, {
          src: 'miny'
        }, {
          src: 'moe'
        }]
      })"
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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        invoke: [{
          src: 'eeny'
        }, {
          src: "miny"
        }, {
          src: 'moe'
        }]
      })"
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
      ]),
    ).toMatchInlineSnapshot(`
      "createMachine({
        invoke: [{
          src: 'eeny'
        }, {
          src: 'miny'
        }, {
          src: "moe"
        }]
      })"
    `);
  });
});
