<script setup lang="ts">
import { storeToRefs } from 'pinia'

import ShortcutRecorder from '@/components/common/ShortcutRecorder.vue'
import { type GlobalAction, globalActionLabels } from '@/constants/hotkeys'
import { useSettingsStore } from '@/stores/settings'

const settings = useSettingsStore()
const { globalShortcutsEnabled, globalShortcuts } = storeToRefs(settings)
const globalActions = Object.keys(globalActionLabels) as GlobalAction[]
</script>

<template>
  <n-card title="全局快捷键" size="small">
    <template #header-extra>
      <n-switch v-model:value="globalShortcutsEnabled" size="small" />
    </template>
    <p class="mb-3 text-xs text-muted">应用在后台时也能响应，默认关闭以免与其他软件冲突</p>
    <div class="space-y-2 text-sm">
      <div v-for="action in globalActions" :key="action" class="flex items-center justify-between">
        <span class="text-muted">{{ globalActionLabels[action] }}</span>
        <ShortcutRecorder v-model="globalShortcuts[action]" :disabled="!globalShortcutsEnabled" />
      </div>
    </div>
    <template #action>
      <n-button
        size="small"
        :disabled="!globalShortcutsEnabled"
        @click="settings.resetGlobalShortcuts()"
      >
        恢复默认
      </n-button>
    </template>
  </n-card>
</template>
