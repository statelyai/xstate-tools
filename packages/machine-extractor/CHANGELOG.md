# @xstate/machine-extractor

## 0.6.1

### Patch Changes

- [#84](https://github.com/statelyai/xstate-tools/pull/84) [`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a bug where transition targets would not be parsed correctly if they were declared using a template literal.

## 0.6.0

### Minor Changes

- [#68](https://github.com/statelyai/xstate-tools/pull/68) [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3) Thanks [@mattpocock](https://github.com/mattpocock)! - Added logic for parsing inline actions, services and guards. This allows for users of this package to parse and edit machines containing inline implementations predictably.

### Patch Changes

- [#69](https://github.com/statelyai/xstate-tools/pull/69) [`2210d4b`](https://github.com/statelyai/xstate-tools/commit/2210d4b5175384f87dc0b001ba68400701c35818) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed issue where tags appeared to be deleted when changes were made in VSCode.
