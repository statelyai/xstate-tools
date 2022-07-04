/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  projects: ["<rootDir>/packages/*"],
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],
};
