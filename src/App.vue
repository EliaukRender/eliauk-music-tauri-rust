<script setup lang="ts">
import { dateZhCN, zhCN } from 'naive-ui'

import { useThemeMode } from '@/composables/useThemeMode'
import { useWindowSettingsSync } from '@/composables/useWindowSettingsSync'
import { naiveThemeOverrides } from '@/theme/naive'

const { naiveTheme } = useThemeMode()
useWindowSettingsSync()
</script>

<template>
  <n-config-provider
    :theme="naiveTheme"
    :theme-overrides="naiveThemeOverrides"
    :locale="zhCN"
    :date-locale="dateZhCN"
    class="h-full"
  >
    <n-message-provider>
      <n-dialog-provider>
        <RouterView />
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>
