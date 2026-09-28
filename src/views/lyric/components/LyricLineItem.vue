<script setup lang="ts">
import type { LyricLine } from '@/utils/lyric/types'

defineProps<{
  line: LyricLine
  active: boolean
  showTrans: boolean
  showRoma: boolean
}>()
</script>

<template>
  <div
    class="lyric-line origin-left cursor-pointer rounded-xl px-4 py-3 transition-[transform,opacity] duration-300 hover:bg-white/8"
    :class="[active ? 'is-active scale-105 opacity-100' : 'opacity-45', { 'text-base': line.meta }]"
  >
    <p class="text-2xl leading-snug font-semibold" :class="{ 'text-base font-normal': line.meta }">
      <template v-if="line.words">
        <span v-for="(word, i) in line.words" :key="i" data-word class="word">{{ word.text }}</span>
      </template>
      <span v-else class="word">{{ line.text }}</span>
    </p>
    <p v-if="showRoma && line.roma" class="mt-1.5 text-sm opacity-80">{{ line.roma }}</p>
    <p v-if="showTrans && line.trans" class="mt-1.5 text-base opacity-80">{{ line.trans }}</p>
  </div>
</template>

<style scoped>
/* 当前行用渐变 + background-clip 实现填充；进度由 LyricScroller 写入 --progress */
.is-active .word {
  background-image: linear-gradient(
    90deg,
    #fff calc(var(--progress, 0) * 100%),
    rgb(255 255 255 / 0.45) calc(var(--progress, 0) * 100%)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
</style>
