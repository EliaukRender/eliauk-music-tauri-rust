import { invoke, isTauri } from '@tauri-apps/api/core'
import { getCurrentWindow } from '@tauri-apps/api/window'

import type { CloseBehavior } from '@/stores/settings'

export const appWindow = isTauri() ? getCurrentWindow() : null

export function minimizeWindow() {
  return appWindow?.minimize()
}

export function toggleMaximizeWindow() {
  return appWindow?.toggleMaximize()
}

export function closeWindow() {
  return appWindow?.close()
}

/** 监听最大化状态变化，返回取消监听函数 */
export async function onMaximizedChange(callback: (maximized: boolean) => void) {
  if (!appWindow) return () => {}
  const win = appWindow
  callback(await win.isMaximized())
  return win.onResized(async () => callback(await win.isMaximized()))
}

/** 关闭行为由 Rust 端在 CloseRequested 中执行，前端只负责同步设置 */
export function syncCloseBehavior(behavior: CloseBehavior) {
  if (!isTauri()) return
  return invoke('set_close_behavior', { behavior })
}
