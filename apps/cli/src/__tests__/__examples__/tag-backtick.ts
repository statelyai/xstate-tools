import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./tag-backtick.typegen').Typegen0,
  tags: 'Say `hello`',
});
