---
"@xstate/tools-shared": patch
---

Fixed an issue with some errors being swallowed when writing typegen file to disk. This has been preventing callers from handling errors appropriately.
