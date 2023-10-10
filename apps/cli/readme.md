## Commands

### xstate typegen <files>

`xstate typegen "src/**/*.ts?(x)"`

Run the typegen against a glob. This will scan every file targeted, and generate a typegen file accompanying it. It will also import the typegen into your file, as described in [our typegen documentation](https://xstate.js.org/docs/guides/typescript.html#typegen-with-the-vscode-extension).

#### Options

`--watch`

Runs the task on a watch, monitoring for changed files and running the typegen script against them.

#### Experimental: xstate sky <files>

`xstate sky "src/**/*.ts?(x)"`

This will scan through the source files and update any Stately Sky-compatible code.
