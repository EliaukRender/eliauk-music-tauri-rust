<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'
import { usePlayerStore } from '@/stores/player'

const { queueDrawerVisible } = storeToRefs(useAppStore())
const { queue } = storeToRefs(usePlayerStore())
</script>

<template>
  <button
    class="flex items-center gap-1 hover:text-fg"
    :class="{ 'text-primary': queueDrawerVisible }"
    title="播放队列"
    @click="queueDrawerVisible = !queueDrawerVisible"
  >
    <i-ri-play-list-2-line class="text-lg" />
    <span v-if="queue.length" class="text-xs tabular-nums">{{ queue.length }}</span>
  </button>
</template>
