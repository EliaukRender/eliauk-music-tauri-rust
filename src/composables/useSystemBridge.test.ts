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
      syncTrayState: vi.fn(async () => {}),
    },
  }
})
vi.mock('@/services/tauri/system-bridge', () => bridge)
vi.mock('@/services/player/audio-engine', () => ({
  audioEngine: { on: vi.fn(), setVolume: vi.fn(), setMuted: vi.fn() },
}))
vi.mock('@/api/modules/song', () => ({ fetchSongUrl: vi.fn(), fetchSongDetail: vi.fn() }))

const { useSystemBridge } = await import('./useSystemBridge')
const { usePlayerStore } = await import('@/stores/player')

describe('composables/useSystemBridge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('把托盘指令转给 player store', async () => {
    const player = usePlayerStore()
    const next = vi.spyOn(player, 'next').mockImplementation(() => {})
    const scope = effectScope()
    scope.run(() => useSystemBridge())
    await nextTick()
    handlerRef.current?.({ type: 'next' })
    expect(next).toHaveBeenCalled()
    scope.stop()
    expect(handlerRef.current).toBeNull()
  })

  it('播放状态变化时同步托盘，未变化不重复调用', async () => {
    const player = usePlayerStore()
    const scope = effectScope()
    scope.run(() => useSystemBridge())
    expect(bridge.syncTrayState).toHaveBeenLastCalledWith({
      title: null,
      artist: null,
      isPlaying: false,
    })
    player.queue = [
      {
        id: 1,
        name: '海屿你',
        artists: [{ id: 1, name: '马也' }],
        album: { id: 0, name: '', picUrl: '' },
        duration: 0,
        fee: 0,
        unavailable: false,
      },
    ]
    player.currentId = 1
    await nextTick()
    expect(bridge.syncTrayState).toHaveBeenLastCalledWith({
      title: '海屿你',
      artist: '马也',
      isPlaying: false,
    })
    const calls = bridge.syncTrayState.mock.calls.length
    player.duration = 100
    await nextTick()
    expect(bridge.syncTrayState).toHaveBeenCalledTimes(calls)
    scope.stop()
  })
})
