# @xstate/tools-shared

## 1.1.4

### Patch Changes

- [#118](https://github.com/statelyai/xstate-tools/pull/118) [`58628f1`](https://github.com/statelyai/xstate-tools/commit/58628f182faeace8e61c995172995f98c9d623af) Thanks [@Andarist](https://github.com/Andarist)! - Fixed issues with typegen generation for quotes in tags and state names.

* [#128](https://github.com/statelyai/xstate-tools/pull/128) [`2d88c75`](https://github.com/statelyai/xstate-tools/commit/2d88c75bb475cd8cee74677b293aaffe124b4d3b) Thanks [@Andarist](https://github.com/Andarist)! - Fixed issues with typegen generation for quotes in actions, delays, guards, services and event types.

- [#121](https://github.com/statelyai/xstate-tools/pull/121) [`7a7f308`](https://github.com/statelyai/xstate-tools/commit/7a7f308672540d95a1c9292a32c60d31c5208d13) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with some errors being swallowed when writing typegen file to disk. This has been preventing callers from handling errors appropriately.

- Updated dependencies [[`c705a64`](https://github.com/statelyai/xstate-tools/commit/c705a64d95fa99046a7acd77f16b9b0dddd2e7ba)]:
  - @xstate/machine-extractor@0.6.3

## 1.1.3

### Patch Changes

- [#109](https://github.com/statelyai/xstate-tools/pull/109) [`a4f96cb`](https://github.com/statelyai/xstate-tools/commit/a4f96cb763ca6ef39912d80008d5d84378bbc9be) Thanks [@Andarist](https://github.com/Andarist)! - Fixed support for experimental `.cts` and `.mts` extensions.

## 1.1.2

### Patch Changes

- Updated dependencies [[`5332727`](https://github.com/statelyai/xstate-tools/commit/5332727a7ad1d4ff00c81e006edc6ffb66f5da88), [`335f349`](https://github.com/statelyai/xstate-tools/commit/335f34934589dbb5c3e9685524c72b9a1badbc0e)]:
  - @xstate/machine-extractor@0.6.2

## 1.1.1

### Patch Changes

- Updated dependencies [[`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed)]:
  - @xstate/machine-extractor@0.6.1

## 1.1.0

### Minor Changes

- [#68](https://github.com/statelyai/xstate-tools/pull/68) [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3) Thanks [@mattpocock](https://github.com/mattpocock)! - Bundled all shared cli/vscode utlities into a single package.

### Patch Changes

- Updated dependencies [[`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3), [`2210d4b`](https://github.com/statelyai/xstate-tools/commit/2210d4b5175384f87dc0b001ba68400701c35818)]:
  - @xstate/machine-extractor@0.6.0
