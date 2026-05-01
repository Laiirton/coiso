import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'tokens/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: false
      }
    },
    rules: {
      'no-console': 'off',
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }
);
