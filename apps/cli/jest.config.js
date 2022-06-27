/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  watchPathIgnorePatterns: [
    "<rootDir>/src/__tests__/__examples__/*.typegen.ts",
    "<rootDir>/src/__tests__/__machineIds__/*.typegen.ts",
  ],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
  snapshotFormat: {
    printBasicPrototype: false,
  },
  transform: {
    "^.+\\.tsx?$": "esbuild-jest",
  },
};
