import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { PlaylistDetail, Song, UserPlaylist } from '@/types/music'

const { api } = vi.hoisted(() => ({
  api: {
    fetchPlaylistDetail: vi.fn(),
    fetchPlaylistTracks: vi.fn(),
    fetchUserPlaylists: vi.fn(),
    createPlaylist: vi.fn(async () => 99),
    deletePlaylist: vi.fn(async () => {}),
    renamePlaylist: vi.fn(async () => {}),
    updatePlaylistTracks: vi.fn(async () => {}),
  },
}))
vi.mock('@/api/modules/playlist', () => api)
vi.mock('@/api/modules/login', () => ({ fetchLoginStatus: vi.fn(), logout: vi.fn() }))

const { usePlaylistStore } = await import('./playlist')
const { useUserStore } = await import('./user')

const UID = 1

function playlist(id: number, partial: Partial<UserPlaylist> = {}): UserPlaylist {
  return {
    id,
    name: `pl-${id}`,
    coverImgUrl: '',
    trackCount: 2,
    creatorId: UID,
    privacy: 0,
    specialType: 0,
    ...partial,
  }
}

function song(id: number): Song {
  return {
    id,
    name: `s-${id}`,
    artists: [],
    album: { id: 0, name: '', picUrl: '' },
    duration: 0,
    fee: 0,
    unavailable: false,
  }
}

function detail(id: number): PlaylistDetail {
  return {
    id,
    name: `pl-${id}`,
    coverImgUrl: '',
    description: null,
    playCount: 0,
    trackCount: 2,
    tags: [],
    specialType: 0,
    creator: { userId: UID, nickname: '', avatarUrl: '' },
  }
}

function login(userId = UID) {
  const user = useUserStore()
  user.cookie = 'MUSIC_U=abc'
  user.profile = { userId, nickname: '', avatarUrl: '', vipType: 0 }
}

describe('stores/playlist', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    api.fetchPlaylistDetail.mockImplementation(async (id: number) => detail(id))
    api.fetchPlaylistTracks.mockImplementation(async () => [song(1), song(2)])
  })

  it('按创建者与 specialType 分组，「我喜欢的音乐」单独提出', async () => {
    login()
    api.fetchUserPlaylists.mockResolvedValueOnce([
      playlist(10, { specialType: 5 }),
      playlist(11),
      playlist(12, { creatorId: 2 }),
      playlist(13, { creatorId: 2, specialType: 5 }),
    ])
    const store = usePlaylistStore()
    await store.fetchMine()
    expect(store.likedPlaylist?.id).toBe(10)
    expect(store.created.map((p) => p.id)).toEqual([11])
    expect(store.subscribed.map((p) => p.id)).toEqual([12, 13])
    expect(store.isOwned(11)).toBe(true)
    expect(store.isOwned(12)).toBe(false)
  })

  it('未登录时不请求用户歌单', async () => {
    await usePlaylistStore().fetchMine()
    expect(api.fetchUserPlaylists).not.toHaveBeenCalled()
  })

  it('请求期间切换账号时丢弃旧结果', async () => {
    login(1)
    let resolve!: (v: UserPlaylist[]) => void
    api.fetchUserPlaylists.mockReturnValueOnce(new Promise((r) => (resolve = r)))
    const store = usePlaylistStore()
    const task = store.fetchMine()
    login(2)
    resolve([playlist(10)])
    await task
    expect(store.mine).toEqual([])
  })

  it('详情缓存命中时不重复请求，并合并并发请求', async () => {
    const store = usePlaylistStore()
    await Promise.all([store.fetchDetail(1), store.fetchDetail(1)])
    await store.fetchDetail(1)
    expect(api.fetchPlaylistDetail).toHaveBeenCalledTimes(1)
    await store.fetchDetail(1, true)
    expect(api.fetchPlaylistDetail).toHaveBeenCalledTimes(2)
  })

  it('详情缓存按最近访问淘汰，最多 20 个', async () => {
    const store = usePlaylistStore()
    for (let id = 1; id <= 20; id++) await store.fetchDetail(id)
    await store.fetchDetail(1)
    await store.fetchDetail(21)
    expect(store.detailCache.size).toBe(20)
    expect(store.detailCache.has(1)).toBe(true)
    expect(store.detailCache.has(2)).toBe(false)
  })

  it('移除歌曲乐观更新，失败时回滚', async () => {
    login()
    api.fetchUserPlaylists.mockResolvedValueOnce([playlist(1)])
    const store = usePlaylistStore()
    await store.fetchMine()
    await store.fetchDetail(1)

    api.updatePlaylistTracks.mockRejectedValueOnce(new Error('网络异常'))
    const task = store.removeSongs(1, [1])
    expect(store.detailCache.get(1)?.songs.map((s) => s.id)).toEqual([2])
    await expect(task).rejects.toThrow('网络异常')
    expect(store.detailCache.get(1)?.songs.map((s) => s.id)).toEqual([1, 2])
    expect(store.detailCache.get(1)?.detail.trackCount).toBe(2)
    expect(store.mine[0]?.trackCount).toBe(2)

    await store.removeSongs(1, [1])
    expect(store.detailCache.get(1)?.songs.map((s) => s.id)).toEqual([2])
    expect(store.mine[0]?.trackCount).toBe(1)
  })

  it('添加歌曲时跳过已在歌单中的歌曲，并让缓存失效', async () => {
    login()
    api.fetchUserPlaylists.mockResolvedValueOnce([playlist(1)])
    const store = usePlaylistStore()
    await store.fetchMine()
    await store.fetchDetail(1)
    const added = await store.addSongs(1, [song(2), song(3)])
    expect(added).toBe(1)
    expect(api.updatePlaylistTracks).toHaveBeenCalledWith('add', 1, [3])
    expect(store.detailCache.has(1)).toBe(false)
    expect(store.mine[0]?.trackCount).toBe(3)

    expect(await store.addSongs(1, [])).toBe(0)
    expect(api.updatePlaylistTracks).toHaveBeenCalledTimes(1)
  })

  it('重命名与删除同步更新侧边栏和缓存', async () => {
    login()
    api.fetchUserPlaylists.mockResolvedValueOnce([playlist(1), playlist(2)])
    const store = usePlaylistStore()
    await store.fetchMine()
    await store.fetchDetail(1)
    await store.rename(1, '新名字')
    expect(store.mine[0]?.name).toBe('新名字')
    expect(store.detailCache.get(1)?.detail.name).toBe('新名字')
    await store.remove(1)
    expect(store.mine.map((p) => p.id)).toEqual([2])
    expect(store.detailCache.has(1)).toBe(false)
  })
})
