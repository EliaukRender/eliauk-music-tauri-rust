import { usePreferredDark } from '@vueuse/core'
import { darkTheme } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { computed, watchEffect } from 'vue'

import { useAppStore } from '@/stores/app'

export function useThemeMode() {
  const { themeMode } = storeToRefs(useAppStore())
  const preferredDark = usePreferredDark()

  const isDark = computed(() =>
    themeMode.value === 'system' ? preferredDark.value : themeMode.value === 'dark',
  )

  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
  })

  const naiveTheme = computed(() => (isDark.value ? darkTheme : null))

  return { themeMode, isDark, naiveTheme }
}
