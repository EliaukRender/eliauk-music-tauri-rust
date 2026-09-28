import { describe, expect, it } from 'vitest'

import { buildLyric, findActiveIndex } from '@/utils/lyric/build'
import { parseLrc } from '@/utils/lyric/parse-lrc'
import { parseYrc } from '@/utils/lyric/parse-yrc'

const META = '{"t":0,"c":[{"tx":"作词: "},{"tx":"黄家驹","li":"http://x"}]}'

describe('parseLrc', () => {
  it('兼容 2 位与 3 位毫秒、1 位小数', () => {
    const lines = parseLrc('[00:12.34]a\n[00:13.345]b\n[01:02.5]c\n[00:05]d')
    expect(lines.map((l) => [l.start, l.text])).toEqual([
      [5, 'd'],
      [12.34, 'a'],
      [13.345, 'b'],
      [62.5, 'c'],
    ])
  })

  it('一行多个时间戳展开为多行并排序', () => {
    const lines = parseLrc('[00:10.00][01:30.00]副歌\n[00:20.00]主歌')
    expect(lines.map((l) => [l.start, l.text])).toEqual([
      [10, '副歌'],
      [20, '主歌'],
      [90, '副歌'],
    ])
  })

  it('解析 JSON 元信息行，忽略标签行', () => {
    const lines = parseLrc(`${META}\n[ar:Beyond]\n[00:01.00]歌词`)
    expect(lines[0]).toEqual({ start: 0, text: '作词: 黄家驹', meta: true })
    expect(lines).toHaveLength(2)
  })

  it('空歌词返回空数组', () => {
    expect(parseLrc('')).toEqual([])
    expect(parseLrc(null)).toEqual([])
  })
})

describe('parseYrc', () => {
  it('解析逐字时间', () => {
    const [line] = parseYrc('[13010,4780](13010,660,0)从(13670,30,0) (13700,670,0)不')
    expect(line?.start).toBe(13.01)
    expect(line?.end).toBeCloseTo(17.79)
    expect(line?.text).toBe('从 不')
    expect(line?.words).toEqual([
      { start: 13.01, duration: 0.66, text: '从' },
      { start: 13.67, duration: 0.03, text: ' ' },
      { start: 13.7, duration: 0.67, text: '不' },
    ])
  })

  it('保留元信息行', () => {
    expect(parseYrc(`${META}\n[1000,500](1000,500,0)a`)[0]?.meta).toBe(true)
  })
})

describe('buildLyric', () => {
  it('优先使用 YRC，并按最近时间合并 LRC 格式的翻译', () => {
    const result = buildLyric({
      lrc: '[00:13.47]从不',
      yrc: '[13010,4780](13010,660,0)从(13670,670,0)不',
      tlyric: '[00:13.47]never',
    })
    expect(result.hasYrc).toBe(true)
    expect(result.hasTrans).toBe(true)
    expect(result.lines[0]?.trans).toBe('never')
  })

  it('没有 YRC 时退化为 LRC，end 取下一行起点，最后一行取歌曲时长', () => {
    const result = buildLyric({ lrc: '[00:01.00]a\n[00:04.00]\n[00:05.00]b' }, 200)
    expect(result.hasYrc).toBe(false)
    expect(result.lines.map((l) => [l.text, l.start, l.end])).toEqual([
      ['a', 1, 4],
      ['b', 5, 200],
    ])
  })

  it('超出容差的翻译不合并', () => {
    const result = buildLyric({ lrc: '[00:01.00]a', tlyric: '[00:05.00]far' })
    expect(result.lines[0]?.trans).toBeUndefined()
  })

  it('元信息行不参与翻译合并', () => {
    const result = buildLyric({ lrc: `${META}\n[00:00.20]a`, tlyric: '[00:00.00]x' })
    expect(result.lines[0]?.trans).toBeUndefined()
    expect(result.lines[1]?.trans).toBe('x')
  })
})

describe('findActiveIndex', () => {
  const lines = buildLyric({ lrc: '[00:01.00]a\n[00:03.00]b\n[00:05.00]c' }, 10).lines

  it.each([
    [0, -1],
    [1, 0],
    [2.9, 0],
    [3, 1],
    [100, 2],
  ])('%d 秒 → 第 %d 行', (time, index) => {
    expect(findActiveIndex(lines, time)).toBe(index)
  })

  it('空歌词返回 -1', () => {
    expect(findActiveIndex([], 5)).toBe(-1)
  })
})
