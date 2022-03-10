# stately-vscode

## 1.7.3

### Patch Changes

- [#99](https://github.com/statelyai/xstate-tools/pull/99) [`5332727`](https://github.com/statelyai/xstate-tools/commit/5332727a7ad1d4ff00c81e006edc6ffb66f5da88) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed an issue where property keys passed an incorrect type would silently fail

* [#100](https://github.com/statelyai/xstate-tools/pull/100) [`335f349`](https://github.com/statelyai/xstate-tools/commit/335f34934589dbb5c3e9685524c72b9a1badbc0e) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where inline guards were not being picked up in non-root events.

* Updated dependencies []:
  - @xstate/tools-shared@1.1.2

## 1.7.2

### Patch Changes

- [#84](https://github.com/statelyai/xstate-tools/pull/84) [`a73fce8`](https://github.com/statelyai/xstate-tools/commit/a73fce843ee04b0701d9d72046da422ff3a65eed) Thanks [@Andarist](https://github.com/Andarist)! - Fixed a bug where transition targets would not be parsed correctly if they were declared using a template literal.

- Updated dependencies []:
  - @xstate/tools-shared@1.1.1

## 1.7.1

### Patch Changes

- [#82](https://github.com/statelyai/xstate-tools/pull/82) [`e49beb2`](https://github.com/statelyai/xstate-tools/commit/e49beb28551ef11b66a158ad2fcac4a5242edb44) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed a bug where prettier was not found in the server bundle, causing an irrecoverable error on startup.

## 1.7.0

### Minor Changes

- [`a1c9de6`](https://github.com/statelyai/xstate-tools/commit/a1c9de6ab1130159da5f59f399869ebbfeaa4281) Thanks [@mattpocock](https://github.com/mattpocock)! - Allowed for parsing and rewriting inline implementations in the VSCode extension. This allows you to use either named actions (which were already supported):

  ```ts
  createMachine({
    entry: ["sayHello"]
  });
  ```

  Or inline actions:

  ```ts
  createMachine({
    entry: [
      () => {
        console.log("Hello!");
      }
    ]
  });
  ```

  Both can now be handled in the VSCode extension. This is true for inline actions, services and guards.

### Patch Changes

- [#69](https://github.com/statelyai/xstate-tools/pull/69) [`2210d4b`](https://github.com/statelyai/xstate-tools/commit/2210d4b5175384f87dc0b001ba68400701c35818) Thanks [@mattpocock](https://github.com/mattpocock)! - Fixed issue where tags appeared to be deleted when changes were made in VSCode.

- Updated dependencies [[`a3b874b`](https://github.com/statelyai/xstate-tools/commit/a3b874b328cd6bf409861378ab2840dab70d3ff3)]:
  - @xstate/tools-shared@1.1.0
