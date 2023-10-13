---
'@xstate/tools-shared': patch
'@xstate/cli': patch
---

Fixed an issue that could result in loss of information about multiple actions within `invoke.onDone`/`invoke.onError` transitions.
