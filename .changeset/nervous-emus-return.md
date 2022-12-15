---
'@xstate/machine-extractor': patch
'stately-vscode': patch
---

Fixed an occasional crash when applying machine edits to machines directly exported from a file, like in the code here:

```js
export default createMachine({});
```
