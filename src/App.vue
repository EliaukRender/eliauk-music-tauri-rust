<script setup lang="ts">
import { dateZhCN, zhCN } from 'naive-ui'
import { onMounted } from 'vue'

import MessageBridge from '@/components/common/MessageBridge.vue'
import { useThemeMode } from '@/composables/useThemeMode'
import { useWindowSettingsSync } from '@/composables/useWindowSettingsSync'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import { naiveThemeOverrides } from '@/theme/naive'

const { naiveTheme } = useThemeMode()
useWindowSettingsSync()

const player = usePlayerStore()
const user = useUserStore()
onMounted(() => {
  void user.refreshLoginStatus()
  void player.restore()
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
    <n-message-provider>
      <MessageBridge>
        <n-dialog-provider>
          <RouterView />
        </n-dialog-provider>
      </MessageBridge>
    </n-message-provider>
  </n-config-provider>
</template>
