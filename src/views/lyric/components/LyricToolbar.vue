<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { LYRIC_OFFSET_STEP, useLyricStore } from '@/stores/lyric'

const lyric = useLyricStore()
const { offset, showTrans, showRoma, hasTrans, hasRoma } = storeToRefs(lyric)

function formatOffset(value: number) {
  if (!value) return '歌词偏移'
  return `${value > 0 ? '提前' : '延后'} ${Math.abs(value).toFixed(1)}s`
}
</script>

<template>
  <div class="flex items-center gap-2 text-xs text-white/70">
    <button
      v-if="hasTrans"
      class="lyric-chip"
      :class="{ 'is-on': showTrans }"
      @click="showTrans = !showTrans"
    >
      译
    </button>
    <button
      v-if="hasRoma"
      class="lyric-chip"
      :class="{ 'is-on': showRoma }"
      @click="showRoma = !showRoma"
    >
      音
    </button>
    <div class="ml-auto flex items-center gap-1">
      <button class="lyric-chip" title="歌词延后" @click="lyric.adjustOffset(-LYRIC_OFFSET_STEP)">
        <i-ri-subtract-line />
      </button>
      <button
        class="min-w-20 rounded-full px-2 py-1 text-center hover:bg-white/10"
        title="点击重置"
        @click="lyric.resetOffset()"
      >
        {{ formatOffset(offset) }}
      </button>
      <button class="lyric-chip" title="歌词提前" @click="lyric.adjustOffset(LYRIC_OFFSET_STEP)">
        <i-ri-add-line />
      </button>
    </div>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.lyric-chip {
  @apply flex size-7 items-center justify-center rounded-full border border-white/20 hover:bg-white/10;
}

.lyric-chip.is-on {
  @apply border-white/60 bg-white/15 text-white;
}
</style>
