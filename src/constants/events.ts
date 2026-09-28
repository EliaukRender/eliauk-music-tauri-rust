/** 与 src-tauri/src/events.rs 保持一致 */
export const AppEvent = {
  /** 托盘、全局快捷键、mini 窗口发给主窗口的播放指令 */
  PlayerCommand: 'player://command',
} as const

export type PlayerCommand = { type: 'toggle' } | { type: 'prev' } | { type: 'next' }
