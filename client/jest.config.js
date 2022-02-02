/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  testMatch: ["**/?(*.)+(spec|test).[jt]s?(x)"],
  watchPathIgnorePatterns: [],
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
