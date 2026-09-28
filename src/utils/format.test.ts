import { describe, expect, it } from 'vitest'

import { formatPlayCount, resizeImage } from './format'

describe('formatPlayCount', () => {
  it.each([
    [0, '0'],
    [9_999, '9999'],
    [10_000, '1万'],
    [123_456, '12万'],
    [100_000_000, '1.0亿'],
    [256_000_000, '2.6亿'],
  ])('%d → %s', (count, expected) => {
    expect(formatPlayCount(count)).toBe(expected)
  })
})

describe('resizeImage', () => {
  it('追加尺寸参数', () => {
    expect(resizeImage('https://p1.music.126.net/a.jpg', 300)).toBe(
      'https://p1.music.126.net/a.jpg?param=300y300',
    )
  })

  it('已有查询参数时用 & 拼接', () => {
    expect(resizeImage('https://x/a.jpg?v=1', 100)).toBe('https://x/a.jpg?v=1&param=100y100')
  })

  it('空地址原样返回', () => {
    expect(resizeImage('', 100)).toBe('')
  })
})
