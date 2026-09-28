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

export async function toggleFullscreen() {
  if (!appWindow) return
  await appWindow.setFullscreen(!(await appWindow.isFullscreen()))
}

export async function exitFullscreen() {
  if (await appWindow?.isFullscreen()) await appWindow?.setFullscreen(false)
}

export type WindowState = { maximized: boolean; fullscreen: boolean }

/** 最大化与全屏都会触发 resize，统一在这里读取状态；返回取消监听函数 */
export async function onWindowStateChange(callback: (state: WindowState) => void) {
  if (!appWindow) return () => {}
  const win = appWindow
  const emit = async () =>
    callback({ maximized: await win.isMaximized(), fullscreen: await win.isFullscreen() })
  await emit()
  return win.onResized(emit)
}

/** 关闭行为由 Rust 端在 CloseRequested 中执行，前端只负责同步设置 */
export function syncCloseBehavior(behavior: CloseBehavior) {
  if (!isTauri()) return
  return invoke('set_close_behavior', { behavior })
}
