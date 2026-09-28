import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'system' | 'light' | 'dark'

export const useAppStore = defineStore(
  'app',
  () => {
    const themeMode = ref<ThemeMode>('system')
    const sidebarCollapsed = ref(false)

    return { themeMode, sidebarCollapsed }
  },
  { persist: true },
)
