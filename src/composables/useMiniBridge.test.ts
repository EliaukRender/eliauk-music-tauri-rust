import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import { AppEvent } from '@/constants/events'
import type { Song } from '@/types/music'

const { mini, readyRef } = vi.hoisted(() => {
  const readyRef: { current: (() => void) | null } = { current: null }
  return {
    readyRef,
    mini: {
      sendToMini: vi.fn(),
      listenCurrent: vi.fn(async (_event: string, handler: () => void) => {
        readyRef.current = handler
        return () => (readyRef.current = null)
      }),
    },
  }
})
vi.mock('@/services/tauri/mini', () => mini)
vi.mock('@/services/player/audio-engine', () => ({
  audioEngine: { on: vi.fn(() => () => {}), setVolume: vi.fn(), setMuted: vi.fn() },
}))
vi.mock('@/api/modules/song', () => ({ fetchSongUrl: vi.fn(), fetchSongDetail: vi.fn() }))

const { useMiniBridge } = await import('./useMiniBridge')
const { usePlayerStore } = await import('@/stores/player')

const song = (id: number): Song => ({
  id,
  name: `s-${id}`,
  artists: [{ id: 1, name: 'a' }],
  album: { id: 0, name: '', picUrl: 'https://p1/x.jpg' },
  duration: 0,
  fee: 0,
  unavailable: false,
})

const eventsSent = () => mini.sendToMini.mock.calls.map(([event]) => event)

describe('composables/useMiniBridge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('mini 就绪前不推送，就绪后推送全量状态与队列', async () => {
    const player = usePlayerStore()
    const scope = effectScope()
    scope.run(() => useMiniBridge())
    player.queue = [song(1), song(2)]
    player.currentId = 1
    await nextTick()
    expect(mini.sendToMini).not.toHaveBeenCalled()

    await nextTick()
    readyRef.current?.()
    expect(eventsSent()).toEqual([AppEvent.MiniState, AppEvent.MiniQueue])
    expect(mini.sendToMini).toHaveBeenCalledWith(
      AppEvent.MiniState,
      expect.objectContaining({
        song: { id: 1, name: 's-1', artist: 'a', cover: 'https://p1/x.jpg?param=128y128' },
        isPlaying: false,
      }),
    )
    scope.stop()
  })

  it('就绪后状态变化只推送状态，队列变化才推送队列', async () => {
    const player = usePlayerStore()
    player.queue = [song(1), song(2)]
    const scope = effectScope()
    scope.run(() => useMiniBridge())
    await nextTick()
    readyRef.current?.()
    mini.sendToMini.mockClear()

    player.currentId = 2
    await nextTick()
    expect(eventsSent()).toEqual([AppEvent.MiniState])

    mini.sendToMini.mockClear()
    player.queue = [...player.queue, song(3)]
    await nextTick()
    expect(eventsSent()).toEqual([AppEvent.MiniQueue])
    scope.stop()
    expect(readyRef.current).toBeNull()
  })
})
