/**@type {import('eslint').Linter.Config} */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@preconstruct/format-js-tag', 'prettier'],
  rules: {
    '@preconstruct/format-js-tag/format': 'error',
    'prettier/prettier': 'error',
  },
};
