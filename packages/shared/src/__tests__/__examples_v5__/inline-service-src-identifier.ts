import { createMachine, fromPromise } from 'xstate5';

const someActor = fromPromise(() => Promise.resolve());

createMachine({
  tsTypes: {} as import('./inline-service-src-identifier.typegen').Typegen0,
  invoke: {
    src: someActor,
  },
});
