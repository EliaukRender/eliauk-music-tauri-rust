import type { AxiosAdapter } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { http } from '@/api/http'
import { fetchBanners, fetchDailyPlaylists, fetchNewSongs } from '@/api/modules/recommend'

vi.mock('@/services/tauri/api-endpoint', () => ({
  resolveApiEndpoint: async () => ({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5000' }),
}))

function respond(data: unknown): AxiosAdapter {
  return async (config) => ({ data, status: 200, statusText: '', headers: {}, config })
}

describe('api/modules/recommend', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('过滤外链广告横幅并升级 https', async () => {
    http.defaults.adapter = respond({
      code: 200,
      banners: [
        { imageUrl: 'http://p1/a.jpg', targetId: 1, targetType: 1, typeTitle: '新歌', url: null },
        { imageUrl: 'http://p1/b.jpg', targetId: 0, targetType: 3000, typeTitle: '广告', url: 'x' },
      ],
    })
    const banners = await fetchBanners()
    expect(banners).toHaveLength(1)
    expect(banners[0]?.imageUrl).toBe('https://p1/a.jpg')
  })

  it('每日推荐歌单兼容 playcount 字段', async () => {
    http.defaults.adapter = respond({
      code: 200,
      recommend: [{ id: 1, name: 'a', picUrl: 'http://p1/c.jpg', playcount: 42, copywriter: '' }],
    })
    expect(await fetchDailyPlaylists()).toEqual([
      { id: 1, name: 'a', picUrl: 'https://p1/c.jpg', playCount: 42, copywriter: undefined },
    ])
  })

  it('新歌速递使用 song.privilege 标记无版权', async () => {
    http.defaults.adapter = respond({
      code: 200,
      result: [
        {
          song: {
            id: 1,
            name: 'a',
            artists: [{ id: 2, name: 'b' }],
            album: { id: 3, name: 'c', picUrl: 'http://p1/d.jpg' },
            duration: 1000,
            fee: 8,
            privilege: { id: 1, st: -200 },
          },
        },
      ],
    })
    const [song] = await fetchNewSongs()
    expect(song?.unavailable).toBe(true)
    expect(song?.album.picUrl).toBe('https://p1/d.jpg')
  })
})
