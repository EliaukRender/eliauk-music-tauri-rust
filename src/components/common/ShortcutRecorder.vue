<script setup lang="ts">
import { useEventListener } from '@vueuse/core'
import { ref } from 'vue'

import { eventToAccelerator, formatAccelerator } from '@/utils/hotkey'
import { usesCommandKey } from '@/utils/platform'

const accelerator = defineModel<string>({ required: true })
defineProps<{ disabled?: boolean }>()

const recording = ref(false)

// 捕获阶段拦截，录制期间不触发应用内快捷键
useEventListener(
  window,
  'keydown',
  (event: KeyboardEvent) => {
    if (!recording.value) return
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') {
      recording.value = false
      return
    }
    const value = eventToAccelerator(event, usesCommandKey)
    if (!value) return
    accelerator.value = value
    recording.value = false
  },
  { capture: true },
)
</script>

<template>
  <button
    class="min-w-32 rounded-md px-2 py-1 text-xs ring-1 ring-line transition-colors hover:ring-primary disabled:opacity-50"
    :class="recording ? 'text-primary ring-primary' : 'bg-elevated'"
    :disabled="disabled"
    @click="recording = !recording"
    @blur="recording = false"
  >
    {{ recording ? '请按下组合键，Esc 取消' : formatAccelerator(accelerator, usesCommandKey) }}
  </button>
</template>
