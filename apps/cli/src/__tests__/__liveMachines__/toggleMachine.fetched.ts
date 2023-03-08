import { createMachine } from 'xstate';
const lightMachine = createMachine({
  id: 'Light Machine',
  initial: 'Off',
  states: {
    Off: {
      on: {
        'Turn on': {
          target: 'On',
        },
      },
    },
    On: {
      on: {
        'Turn off': {
          target: 'Off',
        },
      },
    },
  },
  schema: {
    context: {} as {},
    events: {} as { type: 'Turn on' } | { type: 'Turn off' },
  },
  context: {},
  predictableActionArguments: true,
  preserveActionOrder: true,
  tsTypes: {} as import('./toggleMachine.fetched.typegen').Typegen0,
});
