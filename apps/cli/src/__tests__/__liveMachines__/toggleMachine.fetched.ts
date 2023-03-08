import { createMachine } from 'xstate';
export const lightMachine = createMachine({
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
    events: {} as { type: 'Turn on' } | { type: 'Turn off' },
  },

  predictableActionArguments: true,
  preserveActionOrder: true,
  tsTypes: {} as import('./toggleMachine.fetched.typegen').Typegen0,
});
