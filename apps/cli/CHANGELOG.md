# @xstate/cli

## 0.4.2

### Patch Changes

- [#288](https://github.com/statelyai/xstate-tools/pull/288) [`17dc81c`](https://github.com/statelyai/xstate-tools/commit/17dc81cff5cd3ea1ad28c98642374739d79a6d5d) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with a misleading dev-only warning being printed when generating typegen data because of the internal `createMachine` call.

- Updated dependencies [[`17dc81c`](https://github.com/statelyai/xstate-tools/commit/17dc81cff5cd3ea1ad28c98642374739d79a6d5d)]:
  - @xstate/tools-shared@2.0.2

## 0.4.1

### Patch Changes

- [#267](https://github.com/statelyai/xstate-tools/pull/267) [`2543803`](https://github.com/statelyai/xstate-tools/commit/2543803) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with "hashed IDs" comming up in the generated typegen data and thus confusingly appearing in the IDE autocompletions etc.

- Updated dependencies [[`3d8bb6e`](https://github.com/statelyai/xstate-tools/commit/3d8bb6e6a2c101b782aa1f38a0d0bc29d8852d18), [`e6ccc1e`](https://github.com/statelyai/xstate-tools/commit/e6ccc1ebd10d5dc5ebab0b130c8491b7f1e8fa03), [`96c4506`](https://github.com/statelyai/xstate-tools/commit/96c4506232e84d1aaae6196644029dd2153341ae), [`286d037`](https://github.com/statelyai/xstate-tools/commit/286d0379bb25aefb41f797072f6e68660edbcb9f), [`7471716`](https://github.com/statelyai/xstate-tools/commit/74717167822b6c0c3848108f221d129c300841e9)]:
  - @xstate/machine-extractor@0.9.0
  - @xstate/tools-shared@2.0.1

## 0.3.4

### Patch Changes

- [#220](https://github.com/statelyai/xstate-tools/pull/220) [`39f6393`](https://github.com/statelyai/xstate-tools/commit/39f639321b2291d7f309f39b7184bd2bff1676be) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a bug that caused the path to the typegen file not always being correctly updated in the machine definition when the basename of the file didn't change but its relative location did.

## 0.3.3

### Patch Changes

- [#203](https://github.com/statelyai/xstate-tools/pull/203) [`a49095f`](https://github.com/statelyai/xstate-tools/commit/a49095ff41656a9de2249083614ab1b8777b8a35) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with parametrized guards not being recognized by typegen. Note that this doesn't provide type-safe custom parameters for your guard implementations. It only allows `event` parameter to be inferred.

- Updated dependencies [[`a49095f`](https://github.com/statelyai/xstate-tools/commit/a49095ff41656a9de2249083614ab1b8777b8a35)]:
  - @xstate/machine-extractor@0.7.1
  - @xstate/tools-shared@1.2.3

## 0.3.2

### Patch Changes

- [#195](https://github.com/statelyai/xstate-tools/pull/195) [`446b5aa`](https://github.com/statelyai/xstate-tools/commit/446b5aa1753043032c08385afbc14b6ed3d60e5d) Thanks [@Andarist](https://github.com/Andarist)! - Preserve `predictableActionArguments` config key when updating the machines.

- Updated dependencies [[`446b5aa`](https://github.com/statelyai/xstate-tools/commit/446b5aa1753043032c08385afbc14b6ed3d60e5d)]:
  - @xstate/tools-shared@1.2.2

## 0.3.1

### Patch Changes

- [#190](https://github.com/statelyai/xstate-tools/pull/190) [`a5f091f`](https://github.com/statelyai/xstate-tools/commit/a5f091f0606a183d62dce7dcf45c57474bffab04) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with events leading to a machine being put in its final configuration not being added to the appropriate exit actions.

- Updated dependencies [[`a5f091f`](https://github.com/statelyai/xstate-tools/commit/a5f091f0606a183d62dce7dcf45c57474bffab04)]:
  - @xstate/tools-shared@1.2.1

## 0.3.0

### Minor Changes

- [#114](https://github.com/statelyai/xstate-tools/pull/114) [`267db6b`](https://github.com/statelyai/xstate-tools/commit/267db6b00f6f7fda1145e0631638620b7649afe0) Thanks [@mattpocock](https://github.com/mattpocock)! - Gave typegen the ability to calculate all of the events which can fire exit actions.

### Patch Changes

- [#170](https://github.com/statelyai/xstate-tools/pull/170) [`bd0972c`](https://github.com/statelyai/xstate-tools/commit/bd0972c) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a couple of issues with entry and exit actions not having the appropriate event types associated with them in the generated typegen information. Those issues were mainly related to actions defined on the "path" in the machine in between the source and target states.

* [#182](https://github.com/statelyai/xstate-tools/pull/182) [`fa09f36`](https://github.com/statelyai/xstate-tools/commit/fa09f3648fba735ec205819c3660b20cfac3f6fe) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with some entry actions between the target and the resolved leaf not having the appropriate event types associated them in the generated typegen information.

* Updated dependencies [[`267db6b`](https://github.com/statelyai/xstate-tools/commit/267db6b00f6f7fda1145e0631638620b7649afe0), [`2e1a1f5`](https://github.com/statelyai/xstate-tools/commit/2e1a1f5554481867d3d77916e00c36c98b497f5a), [`fa09f36`](https://github.com/statelyai/xstate-tools/commit/fa09f3648fba735ec205819c3660b20cfac3f6fe)]:
  - @xstate/tools-shared@1.2.0

## 0.2.1

### Patch Changes

- [#129](https://github.com/statelyai/xstate-tools/pull/129) [`117c89a`](https://github.com/statelyai/xstate-tools/commit/117c89a340d794b5c679b41b51b13619f49c8fd6) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where children of states entered from transitions would not have their entry actions or invocations typed properly.

- Updated dependencies [[`117c89a`](https://github.com/statelyai/xstate-tools/commit/117c89a340d794b5c679b41b51b13619f49c8fd6)]:
  - @xstate/tools-shared@1.1.7

## 0.2.0

### Minor Changes

- [#151](https://github.com/statelyai/xstate-tools/pull/151) [`795a057`](https://github.com/statelyai/xstate-tools/commit/795a057f73f0a38784548a1fcf055757f44d0647) Thanks [@mattpocock](https://github.com/mattpocock)! - Added parsing for the `@xstate/test` `createTestMachine` function

### Patch Changes

- Updated dependencies [[`795a057`](https://github.com/statelyai/xstate-tools/commit/795a057f73f0a38784548a1fcf055757f44d0647)]:
  - @xstate/machine-extractor@0.7.0
  - @xstate/tools-shared@1.1.6

## 0.1.7

### Patch Changes

- [#140](https://github.com/statelyai/xstate-tools/pull/140) [`e073819`](https://github.com/statelyai/xstate-tools/commit/e0738191c61290c8f5a9ecdd507e6418ab551518) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with not being able to parse type-only import/export specifiers.

* [#130](https://github.com/statelyai/xstate-tools/pull/130) [`99e4cb5`](https://github.com/statelyai/xstate-tools/commit/99e4cb57f3590448ddbcdc85a3104d29ef0fa79c) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where actions and conditions inside `choose` inside machine options would not be found in typegen.

* Updated dependencies [[`e073819`](https://github.com/statelyai/xstate-tools/commit/e0738191c61290c8f5a9ecdd507e6418ab551518), [`99e4cb5`](https://github.com/statelyai/xstate-tools/commit/99e4cb57f3590448ddbcdc85a3104d29ef0fa79c)]:
  - @xstate/machine-extractor@0.6.4
  - @xstate/tools-shared@1.1.5

## 0.1.6

### Patch Changes

- [#118](https://github.com/statelyai/xstate-tools/pull/118) [`58628f1`](https://github.com/statelyai/xstate-tools/commit/58628f182faeace8e61c995172995f98c9d623af) Thanks [@Andarist](https://github.com/Andarist)! - Fixed issues with typegen generation for quotes in tags and state names.

* [#128](https://github.com/statelyai/xstate-tools/pull/128) [`2d88c75`](https://github.com/statelyai/xstate-tools/commit/2d88c75bb475cd8cee74677b293aaffe124b4d3b) Thanks [@Andarist](https://github.com/Andarist)! - Fixed issues with typegen generation for quotes in actions, delays, guards, services and event types.

- [#121](https://github.com/statelyai/xstate-tools/pull/121) [`7a7f308`](https://github.com/statelyai/xstate-tools/commit/7a7f308672540d95a1c9292a32c60d31c5208d13) Thanks [@Andarist](https://github.com/Andarist)! - Fixed an issue with the CLI reporting zero exit code in case of an error.

- Updated dependencies [[`c705a64`](https://github.com/statelyai/xstate-tools/commit/c705a64d95fa99046a7acd77f16b9b0dddd2e7ba), [`58628f1`](https://github.com/statelyai/xstate-tools/commit/58628f182faeace8e61c995172995f98c9d623af), [`2d88c75`](https://github.com/statelyai/xstate-tools/commit/2d88c75bb475cd8cee74677b293aaffe124b4d3b), [`7a7f308`](https://github.com/statelyai/xstate-tools/commit/7a7f308672540d95a1c9292a32c60d31c5208d13)]:
  - @xstate/machine-extractor@0.6.3
  - @xstate/tools-shared@1.1.4

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
