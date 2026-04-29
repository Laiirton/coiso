import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['node_modules/', 'logs/', 'tmp/'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        console: 'readonly',
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        Buffer: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'curly': ['error', 'multi-line'],
      'eqeqeq': ['error', 'always'],
      'no-throw-literal': 'error',
      'semi': ['error', 'always'],
      'quotes': ['error', 'double', { avoidEscape: true }]
    }
  }
]
