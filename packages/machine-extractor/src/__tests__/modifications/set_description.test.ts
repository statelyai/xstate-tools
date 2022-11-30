import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) =>
  extractMachinesFromFile(outdent.string(code))!.machines[0]!;

describe('set_description', () => {
  it('should be possible to add a description to the root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({})
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: [],
          description: 'Wow, so much wow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        description: \`Wow, so much wow\`
      }"
    `);
  });

  it('should be possible to add a description to a nested state', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {}
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: ['a'],
          description: 'Wow, so much wow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            description: \`Wow, so much wow\`
          }
        }
      }"
    `);
  });

  it('should be possible to update a description at the root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        description: 'really dull description'
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: [],
          description: 'Wow, so much wow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        description: \`Wow, so much wow\`
      }"
    `);
  });

  it('should be possible to remove a description at the root', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        description: 'really dull description'
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: [],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`"{}"`);
  });

  it('should be possible to add a description to a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {}
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          description: 'Wow, so much wow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                description: \`Wow, so much wow\`
              }
            }
          },
          b: {}
        }
      }"
    `);
  });

  it('should be possible to update a description on a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                description: 'really dull description'
              }
            }
          },
          b: {}
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
          description: 'Wow, so much wow',
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                description: \`Wow, so much wow\`
              }
            }
          },
          b: {}
        }
      }"
    `);
  });

  it('should be possible to remove a description from a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        states: {
          a: {
            on: {
              NEXT: {
                target: 'b',
                description: 'really dull description'
              }
            }
          },
          b: {}
        }
      })
  `);

    expect(
      modifiableMachine.modify([
        {
          type: 'set_description',
          statePath: ['a'],
          transitionPath: ['on', 'NEXT', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        states: {
          a: {
            on: {
              NEXT: 'b'
            }
          },
          b: {}
        }
      }"
    `);
  });
});
