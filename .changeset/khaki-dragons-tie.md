---
'@xstate/cli': patch
'stately-vscode': patch
---

Fixed a bug that caused the path to the typegen file not always being correctly updated in the machine definition when the basename of the file didn't change but its relative location did.
