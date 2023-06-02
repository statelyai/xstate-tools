import { createMachine } from 'xstate5';

createMachine(
  {
    tsTypes: {} as import('./service-provided-function.typegen').Typegen0,
    schema: {
      actors: {
        service1: {} as {
          data: boolean;
        },
        service2: {} as {
          data: boolean;
        },
      },
    },
    invoke: [
      {
        src: 'service1',
      },
      {
        src: 'service2',
      },
    ],
  },
  {
    actors: {
      service1() {
        return Promise.resolve(true);
      },
      service2() {
        return Promise.resolve(true);
      },
    },
  },
);
