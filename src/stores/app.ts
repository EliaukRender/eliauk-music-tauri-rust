import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

export const useAppStore = defineStore(
  'app',
  () => {
    const themeMode = ref<ThemeMode>('system')
    const sidebarCollapsed = ref(false)
    /** 放在全局，便于快捷键、mini 窗口等入口打开 */
    const queueDrawerVisible = ref(false)

    return { themeMode, sidebarCollapsed, queueDrawerVisible }
  },
  { persist: { pick: ['themeMode', 'sidebarCollapsed'] } },
)
