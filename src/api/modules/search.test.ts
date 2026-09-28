import type { AxiosAdapter } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/api/http'

import { fetchSuggestions, searchArtists, searchSongs } from './search'

vi.mock('@/services/tauri/api-endpoint', () => ({
  resolveApiEndpoint: async () => ({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5000' }),
}))

function respond(data: unknown): AxiosAdapter {
  return async (config) => ({ data, status: 200, statusText: '', headers: {}, config })
}

describe('api/modules/search', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('无结果时 result 缺失也返回空列表', async () => {
    http.defaults.adapter = respond({ code: 200 })
    expect(await searchSongs('x', 0, 30)).toEqual({ items: [], total: 0 })
  })

  it('歌曲结果按 privilege 标记无版权', async () => {
    http.defaults.adapter = respond({
      code: 200,
      result: {
        songCount: 1,
        songs: [
          { id: 1, name: 'a', ar: [], al: { id: 0, name: '' }, privilege: { id: 1, st: -1 } },
        ],
      },
    })
    const { items, total } = await searchSongs('a', 0, 30)
    expect(total).toBe(1)
    expect(items[0]?.unavailable).toBe(true)
  })

  it('歌手优先使用方形头像', async () => {
    http.defaults.adapter = respond({
      code: 200,
      result: {
        artistCount: 1,
        artists: [{ id: 1, name: 'a', picUrl: 'http://p/1.jpg', img1v1Url: 'http://p/2.jpg' }],
      },
    })
    expect((await searchArtists('a', 0, 30)).items[0]?.avatar).toBe('https://p/2.jpg')
  })

  it('联想结果缺失时返回空数组', async () => {
    http.defaults.adapter = respond({ code: 200, result: {} })
    expect(await fetchSuggestions('a')).toEqual([])
  })
})
