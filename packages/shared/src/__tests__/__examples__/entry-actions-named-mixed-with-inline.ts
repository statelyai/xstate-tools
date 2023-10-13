import { createMachine } from 'xstate';

createMachine({
  tsTypes:
    {} as import('./entry-actions-named-mixed-with-inline.typegen').Typegen0,
  // this test case is using 3 actions on purpose
  // see https://github.com/statelyai/xstate-tools/pull/389
  entry: [function action1() {}, function action2() {}, 'action3'],
});
