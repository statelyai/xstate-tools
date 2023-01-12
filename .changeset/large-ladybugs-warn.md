---
'@xstate/tools-shared': patch
'@xstate/cli': patch
---

Fixed an issue with a misleading dev-only warning being printed when generating typegen data because of the internal `createMachine` call.
