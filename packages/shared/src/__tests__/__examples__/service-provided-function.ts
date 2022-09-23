import { createMachine } from 'xstate';

createMachine(
  {
    tsTypes: {} as import('./service-provided-function.typegen').Typegen0,
    schema: {
      services: {
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
    services: {
      service1() {
        return Promise.resolve(true);
      },
      service2() {
        return Promise.resolve(true);
      },
    },
  },
);
