import { assign, createMachine } from 'xstate';

type Data = {};

type Context = {
  data: Data[];
};

const machine = createMachine(
  {
    initial: 'initialise',
    id: 'machine',
    tsTypes: {} as import('./bug-report-1.typegen').Typegen0,
    schema: {
      context: {
        data: [],
      } as Context,
      services: {} as {
        pollData: {
          data: Data[];
        };
        getData: {
          data: Data[];
        };
      },
    },
    invoke: {
      src: 'pollData',
      onDone: {
        actions: 'assignData',
      },
    },
    states: {
      initialise: {
        invoke: {
          src: 'getData',
          onError: {
            target: 'error',
          },
          onDone: {
            target: 'ready',
            actions: ['assignData'],
          },
        },
      },
      ready: {
        id: 'ready',
        initial: 'idle',
        states: {
          idle: {},
          refresh: {
            invoke: {
              src: 'pollData',
              onDone: {
                target: '#ready.idle',
                actions: 'assignData',
              },
            },
          },
        },
        after: {
          5000: {
            target: '#ready.refresh',
          },
        },
      },
      error: {},
    },
  },
  {
    services: {
      /**
       * This service will now type error if it
       * returns anything other than { id: string }
       */
      pollData: async () => {
        return [];
      },
      getData: async () => {
        return [];
      },
    },
    actions: {
      assignData: (context, event) =>
        assign({
          data: event.data,
        }),
    },
  },
).withConfig({
  actions: {},
});
