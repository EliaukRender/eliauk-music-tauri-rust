<script setup lang="ts">
import { appHotkeys, type HotkeyDefinition } from '@/constants/hotkeys'
import { formatHotkey } from '@/utils/hotkey'
import { usesCommandKey } from '@/utils/platform'

const display = (hotkey: HotkeyDefinition) =>
  formatHotkey(usesCommandKey ? (hotkey.macKeys ?? hotkey.keys) : hotkey.keys, usesCommandKey)
</script>

<template>
  <n-card title="快捷键" size="small">
    <div class="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
      <div v-for="hotkey in appHotkeys" :key="hotkey.action" class="flex justify-between">
        <span class="text-muted">{{ hotkey.label }}</span>
        <kbd class="rounded bg-elevated px-1.5 font-sans text-xs leading-5 ring-1 ring-line">
          {{ display(hotkey) }}
        </kbd>
      </div>
    </div>
  </n-card>
</template>
