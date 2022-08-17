---
"@xstate/machine-extractor": patch
"@xstate/cli": patch
"stately-vscode": patch
---

Fixed an issue with parametrized guards not being recognized by typegen. Note that this doesn't provide type-safe custom parameters for your guard implementations. It only allows `event` parameter to be inferred.
