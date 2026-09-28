<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { dateZhCN, zhCN } from 'naive-ui'

import { useThemeMode } from '@/composables/useThemeMode'
import { useAppStore } from '@/stores/app'
import { naiveThemeOverrides } from '@/theme/naive'
import MiniPlayerView from '@/views/mini/MiniPlayerView.vue'

const { naiveTheme } = useThemeMode()

// 主窗口切换主题时写入 localStorage，storage 事件只会在其他窗口触发
const app = useAppStore()
useEventListener(window, 'storage', (event) => {
  if (event.key === 'eliauk:app') app.$hydrate()
})
</script>

<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="naiveThemeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
    class="h-full"
  >
    <MiniPlayerView />
  </n-config-provider>
</template>
