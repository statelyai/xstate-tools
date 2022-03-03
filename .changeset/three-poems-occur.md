---
"stately-vscode": minor
---

Allowed for parsing and rewriting inline implementations in the VSCode extension. This allows you to use either named actions (which were already supported):

```ts
createMachine({
  entry: ["sayHello"],
});
```

Or inline actions:

```ts
createMachine({
  entry: [
    () => {
      console.log("Hello!");
    },
  ],
});
```

Both can now be handled in the VSCode extension. This is true for inline actions, services and guards.
