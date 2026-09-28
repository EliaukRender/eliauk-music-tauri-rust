import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import type { ArtistSummary } from '@/types/music'

const { api } = vi.hoisted(() => ({ api: { fetchArtists: vi.fn() } }))
vi.mock('@/api/modules/artist', () => api)

const { useArtistList } = await import('@/composables/useArtistList')

const artist = (id: number): ArtistSummary => ({ id, name: `a-${id}`, avatar: '', alias: [] })
const page = (ids: number[], more = true) => ({ artists: ids.map(artist), more })

describe('composables/useArtistList', () => {
  beforeEach(() => vi.clearAllMocks())

  it('按偏移分页加载并去重，没有更多时停止', async () => {
    api.fetchArtists.mockResolvedValueOnce(page([1, 2])).mockResolvedValueOnce(page([2, 3], false))
    const list = useArtistList()
    await list.loadMore()
    await list.loadMore()
    expect(list.artists.value.map((a) => a.id)).toEqual([1, 2, 3])
    expect(api.fetchArtists).toHaveBeenLastCalledWith({ type: -1, area: -1, initial: '-1' }, 2, 30)
    expect(list.hasMore.value).toBe(false)
    await list.loadMore()
    expect(api.fetchArtists).toHaveBeenCalledTimes(2)
  })

  it('加载中重复触发只请求一次', async () => {
    api.fetchArtists.mockResolvedValue(page([1]))
    const list = useArtistList()
    await Promise.all([list.loadMore(), list.loadMore()])
    expect(api.fetchArtists).toHaveBeenCalledTimes(1)
  })

  it('筛选条件变化时重置，并丢弃旧条件迟到的结果', async () => {
    let resolveOld!: (v: ReturnType<typeof page>) => void
    api.fetchArtists
      .mockReturnValueOnce(new Promise((r) => (resolveOld = r)))
      .mockResolvedValueOnce(page([9]))
    const list = useArtistList()
    const old = list.loadMore()
    list.filter.area = 7
    await nextTick()
    await vi.waitFor(() => expect(list.artists.value.map((a) => a.id)).toEqual([9]))
    resolveOld(page([1, 2]))
    await old
    expect(list.artists.value.map((a) => a.id)).toEqual([9])
    expect(api.fetchArtists).toHaveBeenLastCalledWith({ type: -1, area: 7, initial: '-1' }, 0, 30)
  })
})
