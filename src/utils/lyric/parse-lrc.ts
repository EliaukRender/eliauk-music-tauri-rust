import type { RawLine } from './types'

const TIMESTAMP_RE = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g
const LEADING_TIMESTAMPS_RE = /^(?:\[\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?\])+/

type MetaLine = { t: number; c: { tx: string }[] }

/** /lyric/new 在歌词开头插入 JSON 行（作词、作曲等），LRC 与 YRC 都有 */
export function parseMetaLine(line: string): RawLine | null {
  try {
    const meta = JSON.parse(line) as MetaLine
    const text = meta.c
      .map((c) => c.tx)
      .join('')
      .trim()
    return text ? { start: meta.t / 1000, text, meta: true } : null
  } catch {
    return null
  }
}

function toSeconds(min: string, sec: string, fraction = '') {
  // 小数位按位数归一化：.5 = 500ms，.45 = 450ms，.345 = 345ms
  const ms = fraction ? Number(fraction.padEnd(3, '0')) : 0
  return Number(min) * 60 + Number(sec) + ms / 1000
}

/**
 * 兼容 2/3 位毫秒、一行多个时间戳（[00:12.00][01:30.00]副歌）、JSON 元信息行；
 * [ar:xxx] 等标签行和空行被忽略
 */
export function parseLrc(source: string | null | undefined): RawLine[] {
  if (!source) return []
  const lines: RawLine[] = []
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('{')) {
      const meta = parseMetaLine(line)
      if (meta) lines.push(meta)
      continue
    }
    const prefix = line.match(LEADING_TIMESTAMPS_RE)?.[0]
    if (!prefix) continue
    const text = line.slice(prefix.length).trim()
    for (const match of prefix.matchAll(TIMESTAMP_RE)) {
      lines.push({ start: toSeconds(match[1]!, match[2]!, match[3]), text })
    }
  }
  return lines.sort((a, b) => a.start - b.start)
}
