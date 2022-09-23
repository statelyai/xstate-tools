import { createMachine } from 'xstate';

createMachine({
  tsTypes: {} as import('./tag-double-quote.typegen').Typegen0,
  tags: 'Say "hello"',
});
