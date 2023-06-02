import { createMachine, fromPromise } from 'xstate5';

const someActor = fromPromise(() => Promise.resolve());

createMachine({
  tsTypes: {} as import('./inline-actor-with-id.typegen').Typegen0,
  invoke: {
    id: 'someActor',
    src: someActor,
  },
});
