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
    tsTypes: {} as import('./actor-ondone-single-action.typegen').Typegen0,
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
            actions: 'actionA',
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
    },
  },
);
