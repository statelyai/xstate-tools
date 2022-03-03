---
"@xstate/cli": minor
---

Added a watch flag to to allow for re-running typegen on file change.

`xstate typegen "src/**/*.tsx?" --watch`

Runs the task on a watch, monitoring for changed files and running the typegen script against them.
