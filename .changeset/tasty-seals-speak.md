---
"@xstate/cli": patch
"stately-vscode": patch
"@xstate/tools-shared": patch
---

Fixed an issue with some entry actions between the target and the resolved leaf not having the appropriate event types associated them in the generated typegen information.
