import { invoke, isTauri } from '@tauri-apps/api/core'

import type { GlobalAction } from '@/constants/hotkeys'

export type ShortcutBinding = { action: GlobalAction; accelerator: string }
export type ShortcutFailure = { accelerator: string; reason: string }

/** 整体替换已注册的全局快捷键，传空数组即全部注销 */
export async function setGlobalShortcuts(bindings: ShortcutBinding[]) {
  if (!isTauri()) return []
  return invoke<ShortcutFailure[]>('set_global_shortcuts', { bindings })
}
