/**
 * 提交格式：type(scope): 中文描述，例如 `feat(player): 支持单曲循环`
 * @type {import('@commitlint/types').UserConfig}
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'perf',
        'refactor',
        'style',
        'docs',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    // 默认规则会拦截中文描述
    'subject-case': [0],
  },
}
