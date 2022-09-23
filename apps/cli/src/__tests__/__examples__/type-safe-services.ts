import { createMachine } from 'xstate';

const machine = createMachine(
  {
    tsTypes: {} as import('./type-safe-services.typegen').Typegen0,
    schema: {} as {
      services: {
        makeFetch: {
          data: string;
        };
      };
    },
    invoke: {
      src: 'makeFetch',
      onDone: {
        actions: 'sayHello',
      },
    },
  },
  {
    services: {
      makeFetch: (context, event) => {
        return Promise.resolve('string');
      },
    },
    actions: {
      sayHello: (context, event) => {
        ((accept: string) => {})(event.data);
      },
    },
  },
);
