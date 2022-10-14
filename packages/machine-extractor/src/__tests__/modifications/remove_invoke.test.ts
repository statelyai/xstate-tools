import outdent from 'outdent';
import { parseMachinesFromFile } from '../../parseMachinesFromFile';

const getModifiableMachine = (code: string) =>
  parseMachinesFromFile(outdent.string(code)).machines[0];

describe('remove_invoke', () => {
  it('should be possible to remove an invoke', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'workOnOSS',
          onDone: '.happy'
        },
        states: {
          happy: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_invoke',
          path: [],
          invokeIndex: 0,
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          happy: {}
        }
      }"
    `);
  });

  it('should keep other existing invokes', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: [{
          src: 'workOnOSS',
          onDone: '.happy'
        }, {
          src: 'callDavid'
        }],
        states: {
          happy: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_invoke',
          path: [],
          invokeIndex: 0,
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: [{
          src: 'callDavid'
        }],
        states: {
          happy: {}
        }
      }"
    `);
  });
});
