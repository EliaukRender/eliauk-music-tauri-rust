import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import {
  createPlaylist,
  deletePlaylist,
  fetchPlaylistDetail,
  fetchPlaylistTracks,
  fetchUserPlaylists,
  renamePlaylist,
  updatePlaylistTracks,
} from '@/api/modules/playlist'
import {
  type PlaylistDetail,
  PlaylistSpecialType,
  type Song,
  type UserPlaylist,
} from '@/types/music'

import { useUserStore } from './user'

/** 歌单详情缓存上限，按最近访问淘汰 */
const DETAIL_CACHE_LIMIT = 20

export type PlaylistEntry = { detail: PlaylistDetail; songs: Song[] }

export const usePlaylistStore = defineStore('playlist', () => {
  const user = useUserStore()

  const mine = ref<UserPlaylist[]>([])
  const mineLoading = ref(false)
  /** Map 保持插入顺序，访问时重新插入即可实现 LRU */
  const detailCache = ref(new Map<number, PlaylistEntry>())
  const pendingDetails = new Map<number, Promise<PlaylistEntry>>()

  const userId = computed(() => user.profile?.userId ?? null)
  const likedPlaylist = computed(
    () =>
      mine.value.find(
        (p) => p.specialType === PlaylistSpecialType.Liked && p.creatorId === userId.value,
      ) ?? null,
  )
  const created = computed(() =>
    mine.value.filter((p) => p.creatorId === userId.value && p.id !== likedPlaylist.value?.id),
  )
  const subscribed = computed(() => mine.value.filter((p) => p.creatorId !== userId.value))

  function isOwned(id: number) {
    return mine.value.some((p) => p.id === id && p.creatorId === userId.value)
  }

  async function fetchMine() {
    const uid = userId.value
    if (uid === null) return
    mineLoading.value = true
    try {
      const list = await fetchUserPlaylists(uid)
      // 请求期间切换了账号，结果作废
      if (uid === userId.value) mine.value = list
    } finally {
      mineLoading.value = false
    }
  }

  function touch(id: number, entry: PlaylistEntry) {
    const cache = detailCache.value
    cache.delete(id)
    cache.set(id, entry)
    while (cache.size > DETAIL_CACHE_LIMIT) {
      cache.delete(cache.keys().next().value!)
    }
  }

  /** 同一歌单的并发请求合并为一个 */
  async function fetchDetail(id: number, force = false): Promise<PlaylistEntry> {
    const cached = detailCache.value.get(id)
    if (cached && !force) {
      touch(id, cached)
      return cached
    }
    const pending = pendingDetails.get(id)
    if (pending) return pending

    const task = Promise.all([fetchPlaylistDetail(id), fetchPlaylistTracks(id)])
      .then(([detail, songs]) => {
        const entry = { detail, songs }
        touch(id, entry)
        return entry
      })
      .finally(() => pendingDetails.delete(id))
    pendingDetails.set(id, task)
    return task
  }

  function invalidate(id: number) {
    detailCache.value.delete(id)
  }

  async function create(name: string, privacy = false) {
    const id = await createPlaylist(name, privacy)
    await fetchMine()
    return id
  }

  async function remove(id: number) {
    await deletePlaylist(id)
    mine.value = mine.value.filter((p) => p.id !== id)
    invalidate(id)
  }

  async function rename(id: number, name: string) {
    await renamePlaylist(id, name)
    const item = mine.value.find((p) => p.id === id)
    if (item) item.name = name
    const entry = detailCache.value.get(id)
    if (entry) entry.detail.name = name
  }

  function adjustTrackCount(id: number, delta: number) {
    const item = mine.value.find((p) => p.id === id)
    if (item) item.trackCount = Math.max(item.trackCount + delta, 0)
  }

  /** 新歌出现在歌单首位，最简单可靠的方式是让缓存失效，下次进入时重新拉取 */
  async function addSongs(pid: number, songs: Song[]) {
    const entry = detailCache.value.get(pid)
    const existing = new Set(entry?.songs.map((s) => s.id))
    const ids = songs.map((s) => s.id).filter((id) => !existing.has(id))
    if (!ids.length) return 0
    await updatePlaylistTracks('add', pid, ids)
    adjustTrackCount(pid, ids.length)
    invalidate(pid)
    return ids.length
  }

  /** 乐观更新，失败时回滚 */
  async function removeSongs(pid: number, ids: number[]) {
    const idSet = new Set(ids)
    const entry = detailCache.value.get(pid)
    const snapshot = entry ? { songs: entry.songs, trackCount: entry.detail.trackCount } : null
    if (entry) {
      entry.songs = entry.songs.filter((s) => !idSet.has(s.id))
      entry.detail.trackCount = entry.songs.length
    }
    adjustTrackCount(pid, -ids.length)
    try {
      await updatePlaylistTracks('del', pid, ids)
    } catch (error) {
      if (entry && snapshot) {
        entry.songs = snapshot.songs
        entry.detail.trackCount = snapshot.trackCount
      }
      adjustTrackCount(pid, ids.length)
      throw error
    }
  }

  function clear() {
    mine.value = []
    detailCache.value.clear()
  }

  return {
    mine,
    mineLoading,
    detailCache,
    likedPlaylist,
    created,
    subscribed,
    isOwned,
    fetchMine,
    fetchDetail,
    invalidate,
    create,
    remove,
    rename,
    addSongs,
    removeSongs,
    adjustTrackCount,
    clear,
  }
})
