import { defineConfig, globalIgnores } from 'eslint/config'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'node_modules/**',
    'convex/_generated/**',
    'out/**',
    'build/**',
    'dist/**',
    '.output/**',
    '.nitro/**',
    'server/build/**',
    'public/build/**',
    '.tanstack/**',
    '*.tsbuildinfo',
  ]),
  ...tseslint.config(tseslint.configs.recommended),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
])
