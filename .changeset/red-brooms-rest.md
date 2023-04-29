---
'@xstate/tools-shared': patch
'stately-vscode': patch
---

Fixed an issue that caused inline actors with IDs being marked as not provided by typegen. This could result in false positive "Some implementations missing" error.
