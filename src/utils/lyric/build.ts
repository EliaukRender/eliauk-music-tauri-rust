import { parseLrc } from './parse-lrc'
import { parseYrc } from './parse-yrc'
import type { LyricLine, RawLine } from './types'

export type LyricSource = {
  lrc?: string | null
  tlyric?: string | null
  romalrc?: string | null
  yrc?: string | null
}

export type ParsedLyric = {
  lines: LyricLine[]
  hasYrc: boolean
  hasTrans: boolean
  hasRoma: boolean
}

/** 翻译按 LRC 时间戳给出，与 YRC 的行起点可能相差数百毫秒，取最近的一行 */
const MERGE_TOLERANCE = 1

/** 没有下一行时，最后一行至少展示这么久 */
const LAST_LINE_MIN_DURATION = 5

function mergeInto(lines: LyricLine[], extra: RawLine[], key: 'trans' | 'roma') {
  for (const item of extra) {
    if (item.meta || !item.text) continue
    let best: LyricLine | null = null
    let bestDiff = MERGE_TOLERANCE
    for (const line of lines) {
      if (line.meta) continue
      const diff = Math.abs(line.start - item.start)
      if (diff <= bestDiff) {
        best = line
        bestDiff = diff
      }
    }
    if (best && !best[key]) best[key] = item.text
  }
}

/** 优先使用逐字歌词，缺失时退化为 LRC；duration 为歌曲时长（秒），用于最后一行的结束时间 */
export function buildLyric(source: LyricSource, duration = 0): ParsedLyric {
  const yrc = parseYrc(source.yrc)
  const hasYrc = yrc.some((l) => l.words?.length)
  const base = hasYrc ? yrc : parseLrc(source.lrc)

  // 空文本行只用来结束上一行，不显示
  const lines: LyricLine[] = []
  base.forEach((line, index) => {
    if (!line.text) return
    const next = base[index + 1]
    const end = line.end ?? next?.start ?? Math.max(line.start + LAST_LINE_MIN_DURATION, duration)
    lines.push({ ...line, end })
  })

  const trans = parseLrc(source.tlyric)
  const roma = parseLrc(source.romalrc)
  mergeInto(lines, trans, 'trans')
  mergeInto(lines, roma, 'roma')

  return {
    lines,
    hasYrc,
    hasTrans: lines.some((l) => l.trans),
    hasRoma: lines.some((l) => l.roma),
  }
}

/** 最后一个 start <= time 的行，没有则为 -1 */
export function findActiveIndex(lines: readonly LyricLine[], time: number): number {
  let low = 0
  let high = lines.length - 1
  let result = -1
  while (low <= high) {
    const mid = (low + high) >> 1
    if (lines[mid]!.start <= time) {
      result = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }
  return result
}
