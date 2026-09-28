import { invoke, isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

import { AppEvent, type PlayerCommand } from '@/constants/events'

export type TrayPlayerState = {
  title: string | null
  artist: string | null
  isPlaying: boolean
}

/** 只接收发给当前窗口的指令；返回取消监听函数 */
export async function onPlayerCommand(handler: (command: PlayerCommand) => void) {
  if (!isTauri()) return () => {}
  return getCurrentWebviewWindow().listen<PlayerCommand>(AppEvent.PlayerCommand, (event) =>
    handler(event.payload),
  )
}

export async function syncTrayState(state: TrayPlayerState) {
  if (!isTauri()) return
  await invoke('sync_player_state', { state })
}
