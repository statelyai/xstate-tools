---
"@xstate/tools-shared": patch
"stately-vscode": patch
"@xstate/cli": patch
---

Fixed a bug where children of states entered from transitions would not have their entry actions or invocations typed properly.
