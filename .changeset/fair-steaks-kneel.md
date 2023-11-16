---
'@xstate/machine-extractor': minor
---

- Support both actors and guards in machine implementations and if both are present, merges them into a single object

- Support v5 guard keyword for transition conditions and choose action conditions. If both cond and guard are present on a transaction, picks guard.
