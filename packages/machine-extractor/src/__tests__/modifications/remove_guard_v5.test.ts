import outdent from 'outdent';
import { extractMachinesFromFile } from '../../extractMachinesFromFile';

const getModifiableMachine = (code: string) => {
  const modifiable = extractMachinesFromFile(outdent.string(code))!
    .machines[0]!;

  const original = modifiable.modify;
  modifiable.modify = function (edits) {
    return original.call(modifiable, edits, { v5: true });
  };

  return modifiable;
};

describe('remove_guard', () => {
  it('should be possible to remove a guard from a transition', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          WORK_ON_OSS: {
            guard: 'gotPaid',
            target: '.beHappy'
          }
        },
        states: {
          beHappy: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_guard',
          path: [],
          transitionPath: ['on', 'WORK_ON_OSS', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          WORK_ON_OSS: '.beHappy'
        },
        states: {
          beHappy: {}
        }
      }"
    `);
  });

  it('should keep transition as an object if it has other properties', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          WORK_ON_OSS: {
            guard: 'gotPaid',
            target: '.beHappy',
            actions: 'askForRepro'
          }
        },
        states: {
          beHappy: {}
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_guard',
          path: [],
          transitionPath: ['on', 'WORK_ON_OSS', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          WORK_ON_OSS: {
            target: '.beHappy',
            actions: 'askForRepro'
          }
        },
        states: {
          beHappy: {}
        }
      }"
    `);
  });

  it('should be possible to remove a guard from transition array', () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        on: {
          WORK_ON_OSS: [{
            guard: 'gotPaid',
            target: '.happy'
          }, '.unhappy']
        },
        states: {
          happy: {},
          unhappy: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_guard',
          path: [],
          transitionPath: ['on', 'WORK_ON_OSS', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        on: {
          WORK_ON_OSS: ['.happy', '.unhappy']
        },
        states: {
          happy: {},
          unhappy: {},
        }
      }"
    `);
  });

  it(`should be possible to remove a guard from invoke's onDone`, () => {
    const modifiableMachine = getModifiableMachine(`
      createMachine({
        invoke: {
          src: 'workOnOSS',
          onDone: {
            target: '.happy',
            guard: 'gotPaid'
          }
        },
        states: {
          happy: {},
        }
      })
    `);

    expect(
      modifiableMachine.modify([
        {
          type: 'remove_guard',
          path: [],
          transitionPath: ['invoke', 0, 'onDone', 0],
        },
      ]).configEdit.newText,
    ).toMatchInlineSnapshot(`
      "{
        invoke: {
          src: 'workOnOSS',
          onDone: '.happy'
        },
        states: {
          happy: {},
        }
      }"
    `);
  });
});
