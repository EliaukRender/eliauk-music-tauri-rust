import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick } from 'vue'

import type { PlayerCommand } from '@/constants/events'

const { bridge, handlerRef } = vi.hoisted(() => {
  const handlerRef: { current: ((c: PlayerCommand) => void) | null } = { current: null }
  return {
    handlerRef,
    bridge: {
      onPlayerCommand: vi.fn(async (handler: (c: PlayerCommand) => void) => {
        handlerRef.current = handler
        return () => (handlerRef.current = null)
      }),
      syncPlayerState: vi.fn(async () => {}),
    },
  }
})
vi.mock('@/services/tauri/system-bridge', () => bridge)
vi.mock('@/services/player/audio-engine', () => ({
  audioEngine: {
    on: vi.fn(() => () => {}),
    setVolume: vi.fn(),
    setMuted: vi.fn(),
    currentTime: 12,
  },
}))
vi.mock('@/api/modules/song', () => ({ fetchSongUrl: vi.fn(), fetchSongDetail: vi.fn() }))

const { useSystemBridge } = await import('./useSystemBridge')
const { usePlayerStore } = await import('@/stores/player')

describe('composables/useSystemBridge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('把系统指令转给 player store', async () => {
    const player = usePlayerStore()
    const next = vi.spyOn(player, 'next').mockImplementation(() => {})
    const seek = vi.spyOn(player, 'seek').mockImplementation(() => {})
    const seekBy = vi.spyOn(player, 'seekBy').mockImplementation(() => {})
    const toggle = vi.spyOn(player, 'toggle').mockImplementation(async () => {})
    const scope = effectScope()
    scope.run(() => useSystemBridge())
    await nextTick()
    handlerRef.current?.({ type: 'next' })
    handlerRef.current?.({ type: 'seek', position: 30 })
    handlerRef.current?.({ type: 'seek-by', delta: -5 })
    handlerRef.current?.({ type: 'play' })
    expect(next).toHaveBeenCalled()
    expect(seek).toHaveBeenCalledWith(30)
    expect(seekBy).toHaveBeenCalledWith(-5)
    expect(toggle).toHaveBeenCalledTimes(1)
    scope.stop()
    expect(handlerRef.current).toBeNull()
  })

  it('歌曲或播放状态变化时同步，其他字段变化不重复调用', async () => {
    const player = usePlayerStore()
    const scope = effectScope()
    scope.run(() => useSystemBridge())
    expect(bridge.syncPlayerState).toHaveBeenLastCalledWith({
      title: null,
      artist: null,
      album: null,
      coverUrl: null,
      duration: 0,
      position: 12,
      isPlaying: false,
    })
    player.queue = [
      {
        id: 1,
        name: '海屿你',
        artists: [{ id: 1, name: '马也' }],
        album: { id: 0, name: '专辑', picUrl: 'https://p1/a.jpg' },
        duration: 0,
        fee: 0,
        unavailable: false,
      },
    ]
    player.currentId = 1
    await nextTick()
    expect(bridge.syncPlayerState).toHaveBeenLastCalledWith(
      expect.objectContaining({
        title: '海屿你',
        artist: '马也',
        album: '专辑',
        coverUrl: 'https://p1/a.jpg?param=300y300',
      }),
    )
    const calls = bridge.syncPlayerState.mock.calls.length
    player.lastPosition = 100
    await nextTick()
    expect(bridge.syncPlayerState).toHaveBeenCalledTimes(calls)
    scope.stop()
  })
})
