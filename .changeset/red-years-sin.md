---
"@xstate/machine-extractor": patch
"@xstate/tools-shared": patch
"@xstate/cli": patch
"stately-vscode": patch
---

Fixed a bug where actions and conditions inside `choose` inside machine options would not be found in typegen.
