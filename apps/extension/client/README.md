XState VSCode enhances the XState development experience by providing VSCode users with features like visual editing, autocomplete, typegen and linting.

## Quickstart

1. [Install via the Visual Studio Code Marketplace →](https://marketplace.visualstudio.com/items?itemName=statelyai.stately-vscode)
2. Once installed, you can run `XState: Open Visual Editor` from the command palette to open any machine at your cursor's location.
3. If you have code lens enabled (this can be enabled using [`editor.codeLens`](https://code.visualstudio.com/docs/getstarted/settings#_default-settings) setting), you'll also see 'Open Visual Editor' floating above each `createMachine` call.

## Features

### Visually edit machines

Edit any XState machine with drag-and-drop using the [Stately Visual editor](https://stately.ai/editor).

<img src="https://raw.githubusercontent.com/statelyai/xstate-tools/main/assets/editor.png" alt="" />

### Autocomplete

Intelligent suggestions for transition targets and initial states.

<img src="https://raw.githubusercontent.com/statelyai/xstate-tools/main/assets/autocomplete.png" alt="" />

### Linting

Highlights errors and potential bugs in your XState machine definitions.

<img src="https://raw.githubusercontent.com/statelyai/xstate-tools/main/assets/linting.png" alt="" />

### Jump to definition

Navigate around machines easily with jump to definition on targets, actions, guards, services and more.

<img src="https://raw.githubusercontent.com/statelyai/xstate-tools/main/assets/jump-to-definition.png" alt="" />

## Hints and Tips

### Ignoring machines

If you'd like to ignore linting/autocomplete on a machine, add a `// xstate-ignore-next-line` comment on the line above it:

```ts
// xstate-ignore-next-line
createMachine({});
```

### Refactors

Click the lightbulb when hovering an named action, guard or service in a machine to see available refactors.
