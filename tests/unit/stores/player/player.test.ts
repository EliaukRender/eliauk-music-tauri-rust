import { createPinia, setActivePinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

import { PlayMode, PlayStatus } from '@/constants/player'
import type { SongUrl } from '@/types/music'

import { api, deferred, emit, engine, flush, resetHarness, song } from './harness'

vi.mock('@/services/player/audio-engine', async () => ({
  audioEngine: (await import('./harness')).engine,
}))
vi.mock('@/api/modules/song', async () => (await import('./harness')).api)
vi.mock('@/services/notify', () => ({
  notify: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const { usePlayerStore } = await import('@/stores/player/index')
const { useSettingsStore } = await import('@/stores/settings')

describe('stores/player', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetHarness()
  })

  it('playSongs 过滤无版权歌曲并播放指定歌曲', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2, { unavailable: true }), song(3)], 3)
    await flush()
    expect(player.queue.map((s) => s.id)).toEqual([1, 3])
    expect(player.currentId).toBe(3)
    expect(player.status).toBe(PlayStatus.Playing)
    expect(engine.load).toHaveBeenCalledWith('https://cdn/3.mp3', 0)
  })

  it('快速连续切歌只播放最后一次请求的歌曲', async () => {
    const pending = new Map<number, ReturnType<typeof deferred<SongUrl>>>()
    api.fetchSongUrl.mockImplementation((id: number) => {
      const d = deferred<SongUrl>()
      pending.set(id, d)
      return d.promise
    })
    const player = usePlayerStore()
    player.playSongs([1, 2, 3, 4, 5].map((id) => song(id)))
    for (let i = 0; i < 10; i++) player.next()
    // 最终应停在 id=1（1 -> 10 次下一首 -> 列表循环回到 1）
    expect(player.currentId).toBe(1)

    // 请求乱序返回，只有最后一次生效
    for (const [id, d] of [...pending].reverse()) d.resolve({ id, url: `u${id}`, trial: null })
    await flush()
    expect(engine.load).toHaveBeenCalledTimes(1)
    expect(engine.load).toHaveBeenCalledWith('u1', 0)
    expect(player.status).toBe(PlayStatus.Playing)
    api.fetchSongUrl.mockReset()
    api.fetchSongUrl.mockImplementation(async (id) => ({
      id,
      url: `https://cdn/${id}.mp3`,
      trial: null,
    }))
  })

  it('无版权歌曲自动跳过，全部不可播放时停止而不是死循环', async () => {
    api.fetchSongUrl.mockImplementation(async (id) => ({ id, url: null, trial: null }))
    const player = usePlayerStore()
    player.playSongs([song(1), song(2), song(3)])
    await flush()
    await flush()
    expect(api.fetchSongUrl.mock.calls.length).toBeLessThanOrEqual(3)
    expect(player.status).toBe(PlayStatus.Error)
    api.fetchSongUrl.mockImplementation(async (id) => ({
      id,
      url: `https://cdn/${id}.mp3`,
      trial: null,
    }))
  })

  it('快进快退不改变播放状态', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1)])
    await flush()
    engine.currentTime = 3
    player.backward()
    expect(engine.currentTime).toBe(0)
    player.forward()
    expect(engine.currentTime).toBe(5)
    expect(engine.pause).toHaveBeenCalledTimes(1) // 仅加载时的一次
    expect(player.status).toBe(PlayStatus.Playing)
  })

  it('音量 0 会下发到引擎', async () => {
    const player = usePlayerStore()
    player.setVolume(0)
    await flush()
    expect(engine.setVolume).toHaveBeenLastCalledWith(0)
  })

  it('单曲循环自然结束时重播当前歌曲，不重新请求地址', async () => {
    const player = usePlayerStore()
    player.setMode(PlayMode.RepeatOne)
    player.playSongs([song(1), song(2)])
    await flush()
    emit('ended')
    await flush()
    expect(player.currentId).toBe(1)
    expect(api.fetchSongUrl).toHaveBeenCalledTimes(1)
    expect(engine.seek).toHaveBeenLastCalledWith(0)
  })

  it('顺序模式自然结束后播放下一首', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2)])
    await flush()
    emit('ended')
    await flush()
    expect(player.currentId).toBe(2)
  })

  it('媒体出错时重新获取地址并从原位置继续', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1)])
    await flush()
    engine.currentTime = 42
    emit('error')
    await flush()
    expect(api.fetchSongUrl).toHaveBeenCalledTimes(2)
    expect(engine.load).toHaveBeenLastCalledWith('https://cdn/1.mp3', 42)

    // 短时间内再次出错不再重试
    emit('error')
    expect(player.status).toBe(PlayStatus.Error)
  })

  it('暂停后恢复时，地址过期会重新获取', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const player = usePlayerStore()
    player.playSongs([song(1)])
    await flush()
    player.pause()
    expect(player.status).toBe(PlayStatus.Paused)

    await player.toggle()
    expect(api.fetchSongUrl).toHaveBeenCalledTimes(1)

    player.pause()
    vi.setSystemTime(Date.now() + 30 * 60 * 1000)
    engine.currentTime = 80
    await player.toggle()
    expect(api.fetchSongUrl).toHaveBeenCalledTimes(2)
    expect(engine.load).toHaveBeenLastCalledWith('https://cdn/1.mp3', 80)
    vi.useRealTimers()
  })

  it('持久化只保存队列 id，冷启动时补全', async () => {
    // 插件只在 pinia 安装到 app 后生效
    const withPersist = () => {
      const pinia = createPinia().use(createPersistedState())
      createApp({}).use(pinia)
      setActivePinia(pinia)
    }
    withPersist()
    const player = usePlayerStore()
    player.playSongs([song(1), song(2)], 2)
    await flush()
    const saved = JSON.parse(localStorage.getItem('player')!)
    expect(saved.queueIds).toEqual([1, 2])
    expect(saved.queue).toBeUndefined()

    withPersist()
    api.fetchSongDetail.mockResolvedValueOnce([song(1), song(2)])
    const restored = usePlayerStore()
    expect(restored.pendingQueueIds).toEqual([1, 2])
    expect(restored.currentId).toBe(2)
    await restored.restore()
    expect(restored.queue.map((s) => s.id)).toEqual([1, 2])
    expect(restored.currentSong?.id).toBe(2)
    expect(restored.status).toBe(PlayStatus.Paused)
    expect(restored.pendingQueueIds).toEqual([])
  })

  describe('解灰', () => {
    it('关闭时无版权歌曲不进入队列', async () => {
      const player = usePlayerStore()
      player.playSongs([song(1, { unavailable: true }), song(2)])
      await flush()
      expect(player.queue.map((s) => s.id)).toEqual([2])
      expect(api.fetchUnblockedUrl).not.toHaveBeenCalled()
    })

    it('开启后拿不到正常地址时从第三方音源匹配', async () => {
      useSettingsStore().unblockEnabled = true
      api.fetchSongUrl.mockResolvedValueOnce({
        id: 1,
        url: null,
        trial: null,
      })
      api.fetchUnblockedUrl.mockResolvedValueOnce('https://third.party/1.mp3')
      const player = usePlayerStore()
      player.playSongs([song(1, { unavailable: true }), song(2)])
      await flush()
      expect(player.queue.map((s) => s.id)).toEqual([1, 2])
      expect(engine.load).toHaveBeenCalledWith('https://third.party/1.mp3', 0)
      expect(player.unblocked).toBe(true)
      expect(player.status).toBe(PlayStatus.Playing)
    })

    it('开启后正常地址可用时不走解灰', async () => {
      useSettingsStore().unblockEnabled = true
      const player = usePlayerStore()
      player.playSongs([song(1)])
      await flush()
      expect(api.fetchUnblockedUrl).not.toHaveBeenCalled()
      expect(player.unblocked).toBe(false)
    })

    it('解灰也失败时跳到下一首', async () => {
      useSettingsStore().unblockEnabled = true
      api.fetchSongUrl.mockResolvedValueOnce({ id: 1, url: null, trial: null })
      const player = usePlayerStore()
      player.playSongs([song(1, { unavailable: true }), song(2)])
      await flush()
      await flush()
      expect(player.currentId).toBe(2)
      expect(player.unblocked).toBe(false)
    })
  })
})
