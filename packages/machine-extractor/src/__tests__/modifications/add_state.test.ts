import outdent from 'outdent';
import { parseMachinesFromFile } from '../../parseMachinesFromFile';

const getModifiableMachine = (code: string) =>
  parseMachinesFromFile(outdent.string(code)).machines[0];

describe('add_state', () => {
  it('should be possible to add a state to the empty root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_state',
          path: [],
          name: 'just_added',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          just_added: {}
        }
      })"
    `);
  });

  it('should be possible to add a state to the root with already existing state property', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
        }
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_state',
          path: [],
          name: 'just_added',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          foo: {},
          just_added: {}
        }
      })"
    `);
  });

  it('should be possible to add a state to an empty state at a given path', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {},
        }
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_state',
          path: ['foo'],
          name: 'just_added',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          foo: {
            states: {
              just_added: {}
            }
          },
        }
      })"
    `);
  });

  it('should be possible to add a state to a state with already existing state property at a given path', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          foo: {
            states: {
              bar: {}
            }
          },
        }
      })
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_state',
          path: ['foo'],
          name: 'just_added',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          foo: {
            states: {
              bar: {},
              just_added: {}
            }
          },
        }
      })"
    `);
  });

  it(`should be possible to add a state which name isn't a valid identifier`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
	  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'add_state',
          path: [],
          name: 'just added',
        },
      ]).newText,
    ).toMatchInlineSnapshot(`
      "createMachine({
        states: {
          "just added": {}
        }
      })"
    `);
  });
});
