import { isTauri } from '@tauri-apps/api/core'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'

import { WindowLabel } from '@/constants/events'

/** 只接收发给当前窗口的事件（全局 listen 会匹配所有目标）；返回取消监听函数 */
export async function listenCurrent<T>(event: string, handler: (payload: T) => void) {
  if (!isTauri()) return () => {}
  return getCurrentWebviewWindow().listen<T>(event, (e) => handler(e.payload))
}

export function currentWindowLabel() {
  return isTauri() ? getCurrentWebviewWindow().label : WindowLabel.Main
}
