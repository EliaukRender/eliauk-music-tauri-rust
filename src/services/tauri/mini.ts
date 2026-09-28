import { invoke, isTauri } from '@tauri-apps/api/core'
import { emitTo } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

import { AppEvent, type PlayerCommand, WindowLabel } from '@/constants/events'

export function toggleMiniPlayer() {
  if (!isTauri()) return
  return invoke('toggle_mini_player')
}

export function resizeMiniPlayer(height: number) {
  if (!isTauri()) return
  return invoke('resize_mini_player', { height })
}

export function sendToMain(command: PlayerCommand) {
  if (!isTauri()) return
  return emitTo(WindowLabel.Main, AppEvent.PlayerCommand, command)
}

export function notifyMiniReady() {
  if (!isTauri()) return
  return emitTo(WindowLabel.Main, AppEvent.MiniReady)
}

export function sendToMini<T>(event: string, payload: T) {
  if (!isTauri()) return
  return emitTo(WindowLabel.Mini, event, payload)
}

/** 只接收发给当前窗口的事件；返回取消监听函数 */
export async function listenCurrent<T>(event: string, handler: (payload: T) => void) {
  if (!isTauri()) return () => {}
  return getCurrentWebviewWindow().listen<T>(event, (e) => handler(e.payload))
}

export function currentWindowLabel() {
  return isTauri() ? getCurrentWebviewWindow().label : WindowLabel.Main
}
