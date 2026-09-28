import { reactive, ref, watch } from 'vue'

import { fetchArtists } from '@/api/modules/artist'
import { ARTIST_PAGE_SIZE, type ArtistFilter } from '@/constants/artist'
import type { ArtistSummary } from '@/types/music'

/** 分页加载歌手；筛选条件变化时重置，并丢弃旧条件下迟到的结果 */
export function useArtistList() {
  const filter = reactive<ArtistFilter>({ type: -1, area: -1, initial: '-1' })
  const artists = ref<ArtistSummary[]>([])
  const loading = ref(false)
  const hasMore = ref(true)
  const error = ref<Error | null>(null)

  let generation = 0

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const gen = generation
    loading.value = true
    error.value = null
    try {
      const { artists: page, more } = await fetchArtists(
        { ...filter },
        artists.value.length,
        ARTIST_PAGE_SIZE,
      )
      if (gen !== generation) return
      // 接口分页偶尔会返回上一页末尾的重复项
      const seen = new Set(artists.value.map((a) => a.id))
      artists.value.push(...page.filter((a) => !seen.has(a.id)))
      hasMore.value = more && page.length > 0
    } catch (e) {
      if (gen === generation) error.value = e as Error
    } finally {
      if (gen === generation) loading.value = false
    }
  }

  function reset() {
    generation++
    artists.value = []
    hasMore.value = true
    loading.value = false
    error.value = null
    void loadMore()
  }

  watch(() => ({ ...filter }), reset, { deep: true })

  return { filter, artists, loading, hasMore, error, loadMore, reset }
}
