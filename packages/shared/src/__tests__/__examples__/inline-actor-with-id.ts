import { createMachine } from 'xstate';

const someActor = () => Promise.resolve();

createMachine({
  tsTypes: {} as import('./inline-actor-with-id.typegen').Typegen0,
  invoke: {
    id: 'someActor',
    src: someActor,
  },
});
