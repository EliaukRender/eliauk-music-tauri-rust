import js from '@eslint/js'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default defineConfigWithVueTs(
  {
    name: 'app/ignores',
    ignores: [
      'dist/**',
      'src-tauri/**',
      'sidecar/**/node_modules/**',
      'src/types/components.d.ts',
      'design/**',
    ],
  },
  js.configs.recommended,
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    name: 'app/rules',
    plugins: { 'simple-import-sort': simpleImportSort },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/component-name-in-template-casing': [
        'error',
        'PascalCase',
        { registeredComponentsOnly: false, ignores: ['/^n-/', '/^i-/', 'component'] },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      'no-restricted-syntax': [
        'error',
        { selector: 'TSEnumDeclaration', message: '使用 as const 对象代替 enum' },
      ],
    },
  },
  {
    // 模块扩充只能通过 interface 合并声明
    name: 'app/declarations',
    files: ['**/*.d.ts'],
    rules: { '@typescript-eslint/consistent-type-definitions': 'off' },
  },
  {
    name: 'app/node-scripts',
    files: ['sidecar/**/*.{js,cjs,mjs}', 'scripts/**/*.{js,mjs}', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
    rules: { '@typescript-eslint/no-require-imports': 'off' },
  },
  skipFormatting,
)
