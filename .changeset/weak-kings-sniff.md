---
"@xstate/machine-extractor": patch
"@xstate/tools-shared": patch
---

Actions defined as template literals are now evaluated. This resolves an issue
where template literal actions weren't handled by `@xstate/machine-extractor`
causing them not to appear in `typegen`.
