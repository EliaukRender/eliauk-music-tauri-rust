import { type MaybeRefOrGetter, shallowRef, toValue, watch } from 'vue'

import { type CoverPalette, extractCoverPalette } from '@/services/cover-palette'

/** 封面配色；cover 为空、取色失败或黑白封面时为 null。传空字符串即可关闭取色 */
export function useCoverPalette(cover: MaybeRefOrGetter<string>) {
  const palette = shallowRef<CoverPalette | null>(null)

  watch(
    () => toValue(cover),
    async (url, _, onCleanup) => {
      let stale = false
      onCleanup(() => (stale = true))
      if (!url) {
        palette.value = null
        return
      }
      const colors = await extractCoverPalette(url)
      // 切歌很快时丢弃过期结果
      if (!stale) palette.value = colors
    },
    { immediate: true },
  )

  return palette
}
