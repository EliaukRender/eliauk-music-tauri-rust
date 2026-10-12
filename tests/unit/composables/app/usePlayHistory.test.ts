import { createPinia, defineStore, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, effectScope, nextTick, ref } from 'vue'

import type { Song } from '@/types/music'

// 只关心 currentId / isPlaying / currentSong，用最小的替身 store 代替真实播放器
const usePlayerStub = defineStore('player', () => {
  const currentId = ref<number | null>(null)
  const isPlaying = ref(false)
  const currentSong = computed(() =>
    currentId.value === null ? null : ({ id: currentId.value, name: '' } as Song),
  )
  return { currentId, isPlaying, currentSong }
})
vi.mock('@/stores/player', () => ({ usePlayerStore: usePlayerStub }))

const { usePlayHistory } = await import('@/composables/app/usePlayHistory')
const { useHistoryStore } = await import('@/stores/history')

async function setup() {
  const player = usePlayerStub()
  const history = useHistoryStore()
  effectScope().run(() => usePlayHistory())
  const set = async (id: number | null, playing: boolean) => {
    player.currentId = id
    player.isPlaying = playing
    await nextTick()
  }
  const ids = () => history.entries.map((e) => e.song.id)
  return { set, ids }
}

describe('composables/app/usePlayHistory', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('开始播放时记录，暂停后继续不重复记录', async () => {
    const { set, ids } = await setup()
    await set(1, false)
    expect(ids()).toEqual([])
    await set(1, true)
    await set(1, false)
    await set(1, true)
    expect(ids()).toEqual([1])
  })

  it('切歌后记录新歌，再切回来会把旧歌移到最前', async () => {
    const { set, ids } = await setup()
    await set(1, true)
    await set(2, true)
    await set(1, true)
    expect(ids()).toEqual([1, 2])
  })

  it('暂停状态下切歌不记录，直到真正播放', async () => {
    const { set, ids } = await setup()
    await set(1, true)
    await set(2, false)
    expect(ids()).toEqual([1])
    await set(2, true)
    expect(ids()).toEqual([2, 1])
  })
})
