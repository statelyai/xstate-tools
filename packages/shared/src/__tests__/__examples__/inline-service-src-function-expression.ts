import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./inline-service-src-function-expression.typegen').Typegen0,
  invoke: {
    src: () => Promise.resolve(),
  },
});
