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
    /** 需要登录的操作（红心、歌单等）都可以直接唤起 */
    const loginModalVisible = ref(false)
    /** 由 useWindowState 同步 */
    const isMaximized = ref(false)
    const isFullscreen = ref(false)

    return {
      themeMode,
      sidebarCollapsed,
      queueDrawerVisible,
      loginModalVisible,
      isMaximized,
      isFullscreen,
    }
  },
  { persist: { pick: ['themeMode', 'sidebarCollapsed'] } },
)
