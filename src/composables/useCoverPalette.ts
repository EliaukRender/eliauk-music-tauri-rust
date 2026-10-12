import { type Ref, shallowRef, watch } from 'vue'

import type { SpectrumColors } from '@/constants/spectrum'
import { extractCoverPalette } from '@/services/spectrum/cover-palette'
import { usePlayerStore } from '@/stores/player'

/** 当前歌曲封面的配色；enabled 为 false、取色失败或黑白封面时为 null */
export function useCoverPalette(enabled: Ref<boolean>) {
  const player = usePlayerStore()
  const palette = shallowRef<SpectrumColors | null>(null)

  watch(
    [enabled, () => player.currentSong?.album.picUrl ?? ''],
    async ([on, cover], _, onCleanup) => {
      let stale = false
      onCleanup(() => (stale = true))
      if (!on || !cover) {
        palette.value = null
        return
      }
      const colors = await extractCoverPalette(cover)
      // 切歌很快时丢弃过期结果
      if (!stale) palette.value = colors
    },
    { immediate: true },
  )

  return palette
}
