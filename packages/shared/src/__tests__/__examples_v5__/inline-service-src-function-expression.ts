import { createMachine } from 'xstate5';

createMachine({
  tsTypes:
    {} as import('./inline-service-src-function-expression.typegen').Typegen0,
  invoke: {
    src: () => Promise.resolve(),
  },
});
