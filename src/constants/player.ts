export const PlayMode = {
  /** 列表循环 */
  Sequence: 'sequence',
  Shuffle: 'shuffle',
  RepeatOne: 'repeat-one',
} as const
export type PlayMode = (typeof PlayMode)[keyof typeof PlayMode]

/** 与 /song/url/v1 的 level 参数一致 */
export const SoundLevel = {
  Standard: 'standard',
  Higher: 'higher',
  ExHigh: 'exhigh',
  Lossless: 'lossless',
  HiRes: 'hires',
} as const
export type SoundLevel = (typeof SoundLevel)[keyof typeof SoundLevel]

export const PlayStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Playing: 'playing',
  Paused: 'paused',
  Error: 'error',
} as const
export type PlayStatus = (typeof PlayStatus)[keyof typeof PlayStatus]

/** 快进快退步长（秒） */
export const SEEK_STEP = 5
