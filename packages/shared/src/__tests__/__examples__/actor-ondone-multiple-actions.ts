import { createMachine } from 'xstate';

const machine = createMachine(
  {
    schema: {
      services: {} as {
        getData: {
          data: unknown;
        };
      },
    },
    tsTypes: {} as import('./actor-ondone-multiple-actions.typegen').Typegen0,
    predictableActionArguments: true,

    initial: 'A',
    context: {
      value: '',
    },
    states: {
      A: {
        invoke: {
          src: 'getData',
          onDone: {
            actions: ['actionA', 'actionB'],
            target: 'DONE',
          },
        },
      },
      DONE: {},
    },
  },
  {
    actions: {
      actionA: () => {},
      actionB: () => {},
    },
  },
);
