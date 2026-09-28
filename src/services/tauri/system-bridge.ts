import { invoke, isTauri } from '@tauri-apps/api/core'

import { AppEvent, type PlayerCommand } from '@/constants/events'

import { listenCurrent } from './events'

/** 与 src-tauri/src/system/player_sync.rs 的 PlayerSnapshot 保持一致 */
export type PlayerSnapshot = {
  title: string | null
  artist: string | null
  album: string | null
  coverUrl: string | null
  /** 秒 */
  duration: number
  /** 秒，系统媒体中心据此外推进度 */
  position: number
  isPlaying: boolean
}

/** 返回取消监听函数 */
export function onPlayerCommand(handler: (command: PlayerCommand) => void) {
  return listenCurrent(AppEvent.PlayerCommand, handler)
}

/** 同步到托盘与系统媒体中心 */
export async function syncPlayerState(state: PlayerSnapshot) {
  if (!isTauri()) return
  await invoke('sync_player_state', { state })
}
