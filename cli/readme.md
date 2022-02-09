## Commands

### xstate typegen <files>

`xstate typegen "src/**/*.tsx?"`

Run the typegen against a glob. This will scan every file targeted, and generate a typegen file accompanying it. It will also import the typegen into your file, as described in [our typegen documentation](https://xstate.js.org/docs/guides/typescript.html#typegen-with-the-vscode-extension).

#### Options

`--watch`

Runs the task on a watch, monitoring for changed files and running the typegen script against them.

## Development

To try the CLI locally, run:

1. `(cd cli && yarn prepare)`
2. `yarn link` (only needed the very first time)
3. `(cd cli && yarn prepare) && xstate <whatever command you like>`
