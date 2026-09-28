/** 时间单位均为秒 */
export type LyricWord = { start: number; duration: number; text: string }

export type LyricLine = {
  start: number
  end: number
  text: string
  trans?: string
  roma?: string
  /** 逐字歌词（YRC） */
  words?: LyricWord[]
  /** 作词、作曲等信息行 */
  meta?: boolean
}

/** 解析中间结果，end 在合并阶段补齐 */
export type RawLine = Omit<LyricLine, 'end'> & { end?: number }
