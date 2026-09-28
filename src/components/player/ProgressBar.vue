<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

import { usePlayerProgress } from '@/composables/usePlayerProgress'
import { usePlayerStore } from '@/stores/player'
import { formatDuration } from '@/utils/format'

const player = usePlayerStore()
const { duration, currentSong } = storeToRefs(player)
const { currentTime } = usePlayerProgress()

// 拖动期间只更新显示，松手后再 seek，避免拖动时反复缓冲
const dragging = ref(false)
const dragValue = ref(0)

const displayTime = computed(() => (dragging.value ? dragValue.value : currentTime.value))

function onUpdate(value: number) {
  if (dragging.value) {
    dragValue.value = value
  } else {
    player.seek(value)
  }
}

function onDragstart() {
  dragValue.value = currentTime.value
  dragging.value = true
}

function onDragend() {
  dragging.value = false
  player.seek(dragValue.value)
}
</script>

<template>
  <div class="flex w-full items-center gap-3 text-xs text-muted tabular-nums">
    <span class="w-10 text-right">{{ formatDuration(displayTime) }}</span>
    <n-slider
      :value="displayTime"
      :max="duration || 1"
      :step="0.1"
      :tooltip="false"
      :disabled="!currentSong"
      class="flex-1"
      @update:value="onUpdate"
      @dragstart="onDragstart"
      @dragend="onDragend"
    />
    <span class="w-10">{{ formatDuration(duration) }}</span>
  </div>
</template>
