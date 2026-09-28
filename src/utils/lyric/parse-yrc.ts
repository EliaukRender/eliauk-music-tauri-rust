import { parseMetaLine } from './parse-lrc'
import type { LyricWord, RawLine } from './types'

const LINE_RE = /^\[(\d+),(\d+)\](.*)$/
const WORD_RE = /\((\d+),(\d+),\d+\)([^(]*)/g

/** 格式：[行起始ms,行时长ms](字起始ms,字时长ms,0)字(…)… */
export function parseYrc(source: string | null | undefined): RawLine[] {
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
    const match = line.match(LINE_RE)
    if (!match) continue
    const start = Number(match[1]) / 1000
    const words: LyricWord[] = []
    for (const word of match[3]!.matchAll(WORD_RE)) {
      words.push({
        start: Number(word[1]) / 1000,
        duration: Number(word[2]) / 1000,
        text: word[3]!,
      })
    }
    const text = words
      .map((w) => w.text)
      .join('')
      .trim()
    if (!text) continue
    lines.push({ start, end: start + Number(match[2]) / 1000, text, words })
  }
  return lines.sort((a, b) => a.start - b.start)
}
