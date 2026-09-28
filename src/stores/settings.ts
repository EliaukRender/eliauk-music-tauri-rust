import { defineStore } from 'pinia'
import { ref } from 'vue'

/** 与 src-tauri/src/window.rs 中的 CloseBehavior 保持一致 */
export type CloseBehavior = 'minimize' | 'exit'

export const useSettingsStore = defineStore(
  'settings',
  () => {
    const closeBehavior = ref<CloseBehavior>('minimize')

    return { closeBehavior }
  },
  { persist: true },
)
