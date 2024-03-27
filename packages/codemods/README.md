# `@xstate/codemods`

A library of automatic codebase refactors for [XState](https://github.com/statelyai/xstate).

## `v4-to-v5`

This codemod migrates a v4 codebase to v5.

### `machine-to-create-machine`

```diff
-import { Machine } from 'xstate';
+import { createMachine } from 'xstate';

-const machine = Machine({});
+const machine = createMachine({});
```

```diff
-import { Machine as SomethingElse } from 'xstate';
+import { createMachine as SomethingElse } from 'xstate';

 const machine = SomethingElse({})
```

```diff
 import xstate from 'xstate';

-const machine = xstate.Machine({});
+const machine = xstate.createMachine({});
```
