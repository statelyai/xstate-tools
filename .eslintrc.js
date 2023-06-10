/** @type {import('eslint').Linter.Config} */
const config = {
  extends: [
    'eslint:recommended',
    'plugin:eslint-comments/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    browser: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.eslint.json',
      './apps/**/tsconfig.json',
      './packages/*/tsconfig.json',
    ],
  },
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'eslint-comments/no-unused-disable': 'error',
  },
  overrides: [
    // override for all typescript files
    {
      files: ['**/*.{ts,tsx}'],
      extends: [
        // enable type-aware linting rules
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
    },
    // override for workspace config/script files
    {
      files: ['*.js', 'scripts/*.js'],
      rules: {
        // disable `require` errors
        '@typescript-eslint/no-var-requires': 'off',
      },
    },
    // override for test files
    {
      files: ['**/__tests__/**/*.{ts,tsx}', '**/*.{spec,test}.{ts,tsx}'],
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
      rules: {
        '@typescript-eslint/no-empty-function': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unsafe-call': 'warn',
        '@typescript-eslint/no-unsafe-argument': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-member-access': 'warn',
      },
    },
  ],
};

module.exports = config;
