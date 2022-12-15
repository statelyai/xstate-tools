import { createMachine } from 'xstate';

const someActor = () => Promise.resolve();

createMachine({
  tsTypes:
    {} as import('./inline-service-src-function-expression.typegen').Typegen0,
  invoke: {
    src: someActor,
  },
});
