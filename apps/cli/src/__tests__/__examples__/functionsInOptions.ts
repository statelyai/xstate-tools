import { createMachine } from 'xstate';

createMachine(
  {
    tsTypes: {} as import('./functionsInOptions.typegen').Typegen0,
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
    on: {
      FOO: {
        cond: 'guard',
        actions: 'sayHello',
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
    guards: {
      guard() {
        return true;
      },
    },
    actions: {
      sayHello() {},
    },
    services: {
      service1() {
        return Promise.resolve(true);
      },
      service2() {
        return Promise.resolve(true);
      },
    },
  },
).withConfig(
  // Should have no warning because all implementations
  // have been passed
  {},
);
