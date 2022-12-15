---
'@xstate/cli': patch
'stately-vscode': patch
---

author: @Andarist
pr: #267
commit: 2543803

Fixed an issue with "hashed IDs" comming up in the generated typegen data and thus confusingly appearing in the IDE autocompletions etc.
