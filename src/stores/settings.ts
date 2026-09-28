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
    /** 无版权歌曲尝试从第三方音源匹配（解灰），涉及合规风险，默认关闭 */
    const unblockEnabled = ref(false)

    function resetGlobalShortcuts() {
      globalShortcuts.value = { ...defaultGlobalShortcuts }
    }

    return {
      closeBehavior,
      globalShortcutsEnabled,
      globalShortcuts,
      unblockEnabled,
      resetGlobalShortcuts,
    }
  },
  { persist: true },
)
