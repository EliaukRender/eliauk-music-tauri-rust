/** 与 src-tauri/src/events.rs 保持一致 */
export const AppEvent = {
  /** 托盘、全局快捷键、系统媒体中心、mini 窗口发给主窗口的播放指令 */
  PlayerCommand: 'player://command',
  /** 主窗口发给 mini：播放状态（轻量，频繁） */
  MiniState: 'mini://state',
  /** 主窗口发给 mini：播放队列（只在队列变化时） */
  MiniQueue: 'mini://queue',
  /** mini 发给主窗口：挂载完成，请求全量数据 */
  MiniReady: 'mini://ready',
} as const

export const WindowLabel = {
  Main: 'main',
  Mini: 'mini',
} as const

export type PlayerCommand =
  | { type: 'toggle' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'prev' }
  | { type: 'next' }
  /** 秒 */
  | { type: 'seek'; position: number }
  /** 秒，负数为后退 */
  | { type: 'seek-by'; delta: number }
  | { type: 'play-song'; id: number }
  | { type: 'toggle-like' }
