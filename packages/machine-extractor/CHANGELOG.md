# @xstate/machine-extractor

## 0.9.1

### Patch Changes

- [#305](https://github.com/statelyai/xstate-tools/pull/305) [`7689f10`](https://github.com/statelyai/xstate-tools/commit/7689f10018ab5ff72d60f5d854f3eda798f82e12) Thanks [@Andarist](https://github.com/Andarist)! - Changed the default location for the layout string insertion to be **within** the machine config (before its first property).

## 0.9.0

### Minor Changes

- [#271](https://github.com/statelyai/xstate-tools/pull/271) [`7471716`](https://github.com/statelyai/xstate-tools/commit/74717167822b6c0c3848108f221d129c300841e9) Thanks [@Andarist](https://github.com/Andarist)! - Replaced `undefined` with `null` within `MachineEdit` type to ensure that those properties stay JSON-serializable.

### Patch Changes

- [#277](https://github.com/statelyai/xstate-tools/pull/277) [`3d8bb6e`](https://github.com/statelyai/xstate-tools/commit/3d8bb6e6a2c101b782aa1f38a0d0bc29d8852d18) Thanks [@Andarist](https://github.com/Andarist)! - Properly extract state descriptions that are declared using simple template literals from the source code

* [#268](https://github.com/statelyai/xstate-tools/pull/268) [`e6ccc1e`](https://github.com/statelyai/xstate-tools/commit/e6ccc1ebd10d5dc5ebab0b130c8491b7f1e8fa03) Thanks [@Andarist](https://github.com/Andarist)! - Fixed adding `invoke`'s `id` to an existing `invoke`.

- [#273](https://github.com/statelyai/xstate-tools/pull/273) [`96c4506`](https://github.com/statelyai/xstate-tools/commit/96c4506232e84d1aaae6196644029dd2153341ae) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an occasional crash when applying machine edits to machines directly exported from a file, like in the code here:

  ```js
  export default createMachine({});
  ```

* [#276](https://github.com/statelyai/xstate-tools/pull/276) [`286d037`](https://github.com/statelyai/xstate-tools/commit/286d0379bb25aefb41f797072f6e68660edbcb9f) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with not being able to remove states with self-transitions from the code.

## 0.7.1

### Patch Changes

- [#203](https://github.com/statelyai/xstate-tools/pull/203) [`a49095f`](https://github.com/statelyai/xstate-tools/commit/a49095ff41656a9de2249083614ab1b8777b8a35) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with parametrized guards not being recognized by typegen. Note that this doesn't provide type-safe custom parameters for your guard implementations. It only allows `event` parameter to be inferred.

## 0.7.0

### Minor Changes

- [#151](https://github.com/statelyai/xstate-tools/pull/151) [`795a057`](https://github.com/statelyai/xstate-tools/commit/795a057f73f0a38784548a1fcf055757f44d0647) Thanks [@mattpocock](https://github.com/mattpocock)! - Added parsing for the `@xstate/test` `createTestMachine` function

## 0.6.4

### Patch Changes

- [#140](https://github.com/statelyai/xstate-tools/pull/140) [`e073819`](https://github.com/statelyai/xstate-tools/commit/e0738191c61290c8f5a9ecdd507e6418ab551518) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with not being able to parse type-only import/export specifiers.

* [#130](https://github.com/statelyai/xstate-tools/pull/130) [`99e4cb5`](https://github.com/statelyai/xstate-tools/commit/99e4cb57f3590448ddbcdc85a3104d29ef0fa79c) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where actions and conditions inside `choose` inside machine options would not be found in typegen.

## 0.6.3

### Patch Changes

- [#126](https://github.com/statelyai/xstate-tools/pull/126) [`c705a64`](https://github.com/statelyai/xstate-tools/commit/c705a64d95fa99046a7acd77f16b9b0dddd2e7ba) Thanks [@ericjonathan6](https://github.com/ericjonathan6)! - Fixed a bug where descriptions on transitions were not being visualised in VSCode.

## 0.6.2

### Patch Changes

- [#99](https://github.com/statelyai/xstate-tools/pull/99) [`5332727`](https://github.com/statelyai/xstate-tools/commit/5332727a7ad1d4ff00c81e006edc6ffb66f5da88) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed an issue where property keys passed an incorrect type would silently fail

* [#100](https://github.com/statelyai/xstate-tools/pull/100) [`335f349`](https://github.com/statelyai/xstate-tools/commit/335f34934589dbb5c3e9685524c72b9a1badbc0e) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where inline guards were not being picked up in non-root events.

## 0.6.1

### Patch Changes

- [#84](https://github.com/statelyai/xstate-tools/pull/84) [`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a bug where transition targets would not be parsed correctly if they were declared using a template literal.

## 0.6.0

### Minor Changes

- [#68](https://github.com/statelyai/xstate-tools/pull/68) [`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3) Thanks [@mattpocock](https://github.com/mattpocock)! - Added logic for parsing inline actions, services and guards. This allows for users of this package to parse and edit machines containing inline implementations predictably.

### Patch Changes

- [#69](https://github.com/statelyai/xstate-tools/pull/69) [`2210d4b`](https://github.com/statelyai/xstate-tools/commit/2210d4b5175384f87dc0b001ba68400701c35818) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed issue where tags appeared to be deleted when changes were made in VSCode.
