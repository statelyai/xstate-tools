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
    tsTypes: {} as import('./actor-onerror-multiple-actions.typegen').Typegen0,
    predictableActionArguments: true,

    initial: 'A',
    context: {
      value: '',
    },
    states: {
      A: {
        invoke: {
          src: 'getData',
          onError: {
            actions: ['actionA', 'actionB'],
            target: 'ERROR',
          },
        },
      },
      ERROR: {},
    },
  },
  {
    actions: {
      actionA: () => {},
      actionB: () => {},
    },
  },
);
