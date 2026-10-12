import { describe, expect, it } from 'vitest'

import {
  formatDuration,
  formatPlayCount,
  formatPlayedAt,
  joinArtists,
  resizeImage,
} from '@/utils/format'

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

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [5.9, '0:05'],
    [65, '1:05'],
    [3725, '1:02:05'],
    [Number.NaN, '0:00'],
    [-1, '0:00'],
  ])('%d → %s', (seconds, expected) => {
    expect(formatDuration(seconds)).toBe(expected)
  })
})

describe('joinArtists', () => {
  it('用斜杠连接歌手名', () => {
    expect(joinArtists([{ name: 'A' }, { name: 'B' }])).toBe('A / B')
    expect(joinArtists([])).toBe('')
  })
})

describe('formatPlayedAt', () => {
  // 本地时间 2026-10-12 15:30
  const now = new Date(2026, 9, 12, 15, 30).getTime()
  const at = (...args: [number, number, number, number, number]) => new Date(...args).getTime()

  it.each([
    [now - 30_000, '刚刚'],
    [now - 5 * 60_000, '5 分钟前'],
    [at(2026, 9, 12, 9, 5), '09:05'],
    [at(2026, 9, 11, 23, 59), '昨天 23:59'],
    [at(2026, 9, 3, 8, 0), '10月3日'],
    [at(2025, 11, 31, 8, 0), '2025年12月31日'],
  ])('%d → %s', (timestamp, expected) => {
    expect(formatPlayedAt(timestamp, now)).toBe(expected)
  })
})
