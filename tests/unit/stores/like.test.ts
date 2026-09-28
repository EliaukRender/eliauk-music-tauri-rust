import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

const { api, playlistApi } = vi.hoisted(() => ({
  api: {
    fetchLikedIds: vi.fn(async () => [1, 2]),
    likeSong: vi.fn(async () => {}),
  },
  playlistApi: { fetchUserPlaylists: vi.fn() },
}))
vi.mock('@/api/modules/like', () => api)
vi.mock('@/api/modules/playlist', () => playlistApi)
vi.mock('@/api/modules/login', () => ({ fetchLoginStatus: vi.fn(), logout: vi.fn() }))
vi.mock('@/services/notify', () => ({ notify: { error: vi.fn() } }))

const { useLikeStore } = await import('@/stores/like')
const { useUserStore } = await import('@/stores/user')
const { useAppStore } = await import('@/stores/app')
const { usePlaylistStore } = await import('@/stores/playlist')

function login(userId = 1) {
  const user = useUserStore()
  user.cookie = 'MUSIC_U=abc'
  user.profile = { userId, nickname: '', avatarUrl: '', vipType: 0 }
}

describe('stores/like', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('登录后拉取喜欢列表', async () => {
    login()
    const like = useLikeStore()
    await like.fetch()
    expect(like.isLiked(1)).toBe(true)
    expect(like.isLiked(3)).toBe(false)
  })

  it('未登录时点击喜欢会唤起登录框', async () => {
    await useLikeStore().toggle(1)
    expect(useAppStore().loginModalVisible).toBe(true)
    expect(api.likeSong).not.toHaveBeenCalled()
  })

  it('乐观更新，失败时回滚', async () => {
    login()
    const like = useLikeStore()
    await like.fetch()
    let reject!: (e: Error) => void
    api.likeSong.mockReturnValueOnce(new Promise((_, r) => (reject = r)))
    const task = like.toggle(3)
    expect(like.isLiked(3)).toBe(true)
    reject(new Error('网络异常'))
    await task
    expect(like.isLiked(3)).toBe(false)
  })

  it('请求中重复点击被忽略', async () => {
    login()
    const like = useLikeStore()
    await like.fetch()
    const task = like.toggle(1)
    await like.toggle(1)
    await task
    expect(api.likeSong).toHaveBeenCalledTimes(1)
    expect(api.likeSong).toHaveBeenCalledWith(1, false)
    expect(like.isLiked(1)).toBe(false)
  })

  it('成功后让「我喜欢的音乐」缓存失效并更新数量', async () => {
    login()
    playlistApi.fetchUserPlaylists.mockResolvedValueOnce([
      {
        id: 10,
        name: '',
        coverImgUrl: '',
        trackCount: 2,
        creatorId: 1,
        privacy: 0,
        specialType: 5,
      },
    ])
    const playlist = usePlaylistStore()
    await playlist.fetchMine()
    playlist.detailCache.set(10, { detail: {} as never, songs: [] })
    const like = useLikeStore()
    await like.toggle(3)
    expect(playlist.detailCache.has(10)).toBe(false)
    expect(playlist.likedPlaylist?.trackCount).toBe(3)
  })

  it('其他账号的持久化数据不生效', async () => {
    login(1)
    const like = useLikeStore()
    await like.fetch()
    login(2)
    expect(like.isLiked(1)).toBe(false)
  })

  it('持久化时 Set 与数组互转', async () => {
    const setup = () => {
      const pinia = createPinia().use(createPersistedState())
      createApp({}).use(pinia)
      setActivePinia(pinia)
    }
    setup()
    login()
    await useLikeStore().fetch()
    expect(JSON.parse(localStorage.getItem('like')!)).toEqual({ ids: [1, 2], loadedFor: 1 })

    setup()
    login()
    const restored = useLikeStore()
    expect(restored.ids).toBeInstanceOf(Set)
    expect(restored.isLiked(2)).toBe(true)
  })
})
