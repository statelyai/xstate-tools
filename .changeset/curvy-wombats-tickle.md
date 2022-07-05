---
"@xstate/cli": patch
"stately-vscode": patch
"@xstate/tools-shared": patch
---

pr: #170
commit: bd0972c

Fixed a couple of issues with entry and exit actions not having the appropriate event types associated with them in the generated typegen information. Those issues were mainly related to actions defined on the "path" in the machine in between the source and target states.
