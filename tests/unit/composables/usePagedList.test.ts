import { describe, expect, it, vi } from 'vitest'

import { usePagedList } from '@/composables/usePagedList'

const items = (ids: number[]) => ids.map((id) => ({ id }))

describe('composables/usePagedList', () => {
  it('达到 total 后不再请求，并去重', async () => {
    const fetchPage = vi
      .fn()
      .mockResolvedValueOnce({ items: items([1, 2]), total: 3 })
      .mockResolvedValueOnce({ items: items([2, 3]), total: 3 })
    const list = usePagedList(fetchPage, 2)
    await list.loadMore()
    await list.loadMore()
    await list.loadMore()
    expect(list.items.value.map((i) => i.id)).toEqual([1, 2, 3])
    expect(fetchPage).toHaveBeenCalledTimes(2)
    expect(fetchPage).toHaveBeenLastCalledWith(2, 2)
    expect(list.hasMore.value).toBe(false)
  })

  it('空结果视为没有更多', async () => {
    const list = usePagedList(vi.fn().mockResolvedValue({ items: [], total: 0 }))
    await list.loadMore()
    expect(list.hasMore.value).toBe(false)
  })

  it('reset 后丢弃旧请求的结果', async () => {
    let resolve!: (v: { items: { id: number }[]; total: number }) => void
    const fetchPage = vi.fn().mockReturnValueOnce(new Promise((r) => (resolve = r)))
    const list = usePagedList(fetchPage)
    const task = list.loadMore()
    list.reset()
    resolve({ items: items([1]), total: 1 })
    await task
    expect(list.items.value).toEqual([])
    expect(list.loading.value).toBe(false)
  })

  it('失败时记录错误并允许重试', async () => {
    const fetchPage = vi
      .fn()
      .mockRejectedValueOnce(new Error('网络异常'))
      .mockResolvedValueOnce({ items: items([1]), total: 1 })
    const list = usePagedList(fetchPage)
    await list.loadMore()
    expect(list.error.value?.message).toBe('网络异常')
    await list.loadMore()
    expect(list.items.value).toHaveLength(1)
  })
})
