/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
  snapshotFormat: {
    printBasicPrototype: false,
  },
};
