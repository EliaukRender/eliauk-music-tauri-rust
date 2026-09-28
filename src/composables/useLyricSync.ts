import { useRafFn } from '@vueuse/core'
import { type Ref, ref } from 'vue'

import { audioEngine } from '@/services/player/audio-engine'
import { findActiveIndex } from '@/utils/lyric/build'
import type { LyricLine } from '@/utils/lyric/types'

/**
 * 每帧从音频时间派生当前行，暂停、seek、切歌都不需要额外修正。
 * 只有行号变化才写响应式状态；逐字进度由 onFrame 直接写 DOM，避免每帧触发 diff。
 */
export function useLyricSync(
  lines: Ref<LyricLine[]>,
  offset: Ref<number>,
  onFrame?: (time: number, index: number) => void,
) {
  const activeIndex = ref(-1)

  useRafFn(() => {
    const time = audioEngine.currentTime + offset.value
    const index = findActiveIndex(lines.value, time)
    if (index !== activeIndex.value) activeIndex.value = index
    onFrame?.(time, index)
  })

  return { activeIndex }
}
