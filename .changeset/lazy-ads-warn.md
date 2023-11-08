---
'@xstate/vscode-server': patch
---

Action objects (`{ type: 'action1' }`) are now checked as part of the unused action implementation algorithm.

This resolves an issue where action objects could reference a valid implementation but the extension reported a warning that the implementation was unused.
