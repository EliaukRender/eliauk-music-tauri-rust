import { type Ref, ref, shallowRef } from 'vue'

export type PageResult<T> = { items: T[]; total: number }

/**
 * 按偏移分页加载；reset 后丢弃旧请求迟到的结果。
 * total 为 0 或已加载数达到 total 时视为没有更多
 */
export function usePagedList<T extends { id: number }>(
  fetchPage: (offset: number, limit: number) => Promise<PageResult<T>>,
  pageSize = 30,
) {
  const items = ref([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)
  const hasMore = ref(true)
  const error = shallowRef<Error | null>(null)

  let generation = 0

  async function loadMore() {
    if (loading.value || !hasMore.value) return
    const gen = generation
    loading.value = true
    error.value = null
    try {
      const page = await fetchPage(items.value.length, pageSize)
      if (gen !== generation) return
      const seen = new Set(items.value.map((item) => item.id))
      items.value.push(...page.items.filter((item) => !seen.has(item.id)))
      total.value = page.total
      hasMore.value = page.items.length > 0 && items.value.length < page.total
    } catch (e) {
      if (gen === generation) error.value = e as Error
    } finally {
      if (gen === generation) loading.value = false
    }
  }

  function reset() {
    generation++
    items.value = []
    total.value = 0
    hasMore.value = true
    loading.value = false
    error.value = null
  }

  return { items, total, loading, hasMore, error, loadMore, reset }
}
