<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { nextTick, toRef, useTemplateRef, watch } from 'vue'

import { useLyricSync } from '@/composables/useLyricSync'
import { usePlayerStore } from '@/stores/player'
import type { LyricLine } from '@/utils/lyric/types'

import LyricLineItem from './LyricLineItem.vue'

const props = defineProps<{
  lines: LyricLine[]
  offset: number
  showTrans: boolean
  showRoma: boolean
}>()

/** 用户手动滚动后暂停自动跟随的时长 */
const MANUAL_SCROLL_HOLD = 3000

const player = usePlayerStore()
const scrollerRef = useTemplateRef<HTMLElement>('scroller')
const lineRefs: HTMLElement[] = []

let holdUntil = 0
let activeWords: HTMLElement[] = []

const { activeIndex } = useLyricSync(
  toRef(props, 'lines'),
  toRef(props, 'offset'),
  (time, index) => {
    const line = props.lines[index]
    const el = lineRefs[index]
    if (!line || !el) return
    if (line.words) {
      line.words.forEach((word, i) => {
        const progress = word.duration ? (time - word.start) / word.duration : 1
        activeWords[i]?.style.setProperty('--progress', String(clamp(progress)))
      })
    } else {
      const progress = (time - line.start) / (line.end - line.start || 1)
      el.style.setProperty('--progress', String(clamp(progress)))
    }
  },
)

function clamp(value: number) {
  return Math.min(Math.max(value, 0), 1)
}

function center(behavior: ScrollBehavior = 'smooth') {
  const scroller = scrollerRef.value
  const el = lineRefs[activeIndex.value]
  if (!scroller || !el) return
  scroller.scrollTo({
    top: el.offsetTop - scroller.clientHeight / 2 + el.clientHeight / 2,
    behavior,
  })
}

watch(activeIndex, async (index) => {
  activeWords = Array.from(lineRefs[index]?.querySelectorAll<HTMLElement>('[data-word]') ?? [])
  await nextTick()
  if (Date.now() >= holdUntil) center()
})

// 切歌后回到顶部，窗口缩放后重新居中
watch(
  () => props.lines,
  () => nextTick(() => scrollerRef.value?.scrollTo({ top: 0 })),
)
useResizeObserver(scrollerRef, () => center('auto'))

function onManualScroll() {
  holdUntil = Date.now() + MANUAL_SCROLL_HOLD
}

function seekTo(line: LyricLine) {
  holdUntil = 0
  player.seek(Math.max(line.start - props.offset, 0))
}
</script>

<template>
  <div
    ref="scroller"
    class="lyric-scroller relative h-full overflow-y-auto"
    @wheel.passive="onManualScroll"
    @touchmove.passive="onManualScroll"
  >
    <!-- 上下各留半屏空白，首尾行也能滚到中间 -->
    <div class="h-1/2" />
    <LyricLineItem
      v-for="(line, index) in lines"
      :key="`${line.start}-${index}`"
      :ref="(el) => (lineRefs[index] = (el as { $el: HTMLElement } | null)?.$el as HTMLElement)"
      :line="line"
      :active="index === activeIndex"
      :show-trans="showTrans"
      :show-roma="showRoma"
      @click="seekTo(line)"
    />
    <div class="h-1/2" />
  </div>
</template>

<style scoped>
.lyric-scroller {
  scrollbar-width: none;
  mask-image: linear-gradient(transparent, #000 15%, #000 85%, transparent);
}

.lyric-scroller::-webkit-scrollbar {
  display: none;
}
</style>
