---
"stately-vscode": patch
---

Fixed an issue with updating the generated typegen files even if there was no actual change in their output. This reduces the amount of the file system notifications triggered by updating the typegen files.
