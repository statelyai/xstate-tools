# @xstate/cli

## 0.1.5

### Patch Changes

- [#109](https://github.com/statelyai/xstate-tools/pull/109) [`a4f96cb`](https://github.com/statelyai/xstate-tools/commit/a4f96cb763ca6ef39912d80008d5d84378bbc9be) Thanks [@Andarist](https://github.com/Andarist)! - Fixed support for experimental `.cts` and `.mts` extensions.

* [#112](https://github.com/statelyai/xstate-tools/pull/112) [`c9a52c0`](https://github.com/statelyai/xstate-tools/commit/c9a52c0f0e97a4b58da7168a1ad55e460a72ba48) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where multiple machines in the same file would always be labelled with `Typegen0`, causing incorrect type information to be sent through the system.

* Updated dependencies [[`a4f96cb`](https://github.com/statelyai/xstate-tools/commit/a4f96cb763ca6ef39912d80008d5d84378bbc9be)]:
  - @xstate/tools-shared@1.1.3

## 0.1.4

### Patch Changes

- [#99](https://github.com/statelyai/xstate-tools/pull/99) [`5332727`](https://github.com/statelyai/xstate-tools/commit/5332727a7ad1d4ff00c81e006edc6ffb66f5da88) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed an issue where property keys passed an incorrect type would silently fail

- Updated dependencies [[`5332727`](https://github.com/statelyai/xstate-tools/commit/5332727a7ad1d4ff00c81e006edc6ffb66f5da88), [`335f349`](https://github.com/statelyai/xstate-tools/commit/335f34934589dbb5c3e9685524c72b9a1badbc0e)]:
  - @xstate/machine-extractor@0.6.2
  - @xstate/tools-shared@1.1.2

## 0.1.3

### Patch Changes

- [#94](https://github.com/statelyai/xstate-tools/pull/94) [`b648b8e`](https://github.com/statelyai/xstate-tools/commit/b648b8ea0db03c27cbbdd93193f8c482a5a8ad02) Thanks [@Andarist](https://github.com/Andarist)! - Reduced success logs to only be printed for files that actually contain machines.

## 0.1.2

### Patch Changes

- [#84](https://github.com/statelyai/xstate-tools/pull/84) [`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a bug where transition targets would not be parsed correctly if they were declared using a template literal.

- Updated dependencies [[`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed)]:
  - @xstate/machine-extractor@0.6.1
  - @xstate/tools-shared@1.1.1

## 0.1.1

### Patch Changes

- [#79](https://github.com/statelyai/xstate-tools/pull/79) [`db1f2c0`](https://github.com/statelyai/xstate-tools/commit/db1f2c0005ce21adbfce82406754a98a3bcb3680) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed an error where `@babel/core` needed to be installed as a peer dependency in order for the CLI to be usable.

## 0.1.0

### Minor Changes

- [#68](https://github.com/statelyai/xstate-tools/pull/68) [`9eadb14`](https://github.com/statelyai/xstate-tools/commit/9eadb143bc16e0a023c89272f5c5cc066f382d3e) Thanks [@mattpocock](https://github.com/mattpocock)! - Added a typegen command which allows for running XState's typegen in CLI.

  `xstate typegen "src/**/*.tsx?"`

  Run the typegen against a glob. This will scan every file targeted, and generate a typegen file accompanying it. It will also import the typegen into your file, as described in [our typegen documentation](https://xstate.js.org/docs/guides/typescript.html#typegen-with-the-vscode-extension).

  > Ensure you wrap your glob in quotes so that it executes correctly. If it isn't wrapped in quotes, it will be interpreted as a list of files, not a glob. This will give unexpected results.

* [#68](https://github.com/statelyai/xstate-tools/pull/68) [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3) Thanks [@mattpocock](https://github.com/mattpocock)! - Added a watch flag to to allow for re-running typegen on file change.

  `xstate typegen "src/**/*.tsx?" --watch`

  Runs the task on a watch, monitoring for changed files and running the typegen script against them.

### Patch Changes

- Updated dependencies [[`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3), [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3), [`2210d4b`](https://github.com/statelyai/xstate-tools/commit/2210d4b5175384f87dc0b001ba68400701c35818)]:
  - @xstate/machine-extractor@0.6.0
  - @xstate/tools-shared@1.1.0
