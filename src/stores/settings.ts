import { defineStore } from 'pinia'
import { ref } from 'vue'

import { defaultGlobalShortcuts, type GlobalAction } from '@/constants/hotkeys'

/** 与 src-tauri/src/window.rs 中的 CloseBehavior 保持一致 */
export type CloseBehavior = 'minimize' | 'exit'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const closeBehavior = ref<CloseBehavior>('minimize')
    /** 默认关闭，避免与其他软件冲突 */
    const globalShortcutsEnabled = ref(false)
    const globalShortcuts = ref<Record<GlobalAction, string>>({ ...defaultGlobalShortcuts })

    function resetGlobalShortcuts() {
      globalShortcuts.value = { ...defaultGlobalShortcuts }
    }

    return { closeBehavior, globalShortcutsEnabled, globalShortcuts, resetGlobalShortcuts }
  },
  { persist: true },
)
