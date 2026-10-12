import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PlayMode, PlayStatus } from '@/constants/player'

import { api, engine, flush, resetHarness, song } from './harness'

vi.mock('@/services/player/audio-engine', async () => ({
  audioEngine: (await import('./harness')).engine,
}))
vi.mock('@/api/modules/song', async () => (await import('./harness')).api)
vi.mock('@/services/notify', () => ({
  notify: { info: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}))

const { usePlayerStore } = await import('@/stores/player/index')

describe('stores/player/queue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetHarness()
  })

  it('移除非当前歌曲不影响播放', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2), song(3)])
    await flush()
    player.removeFromQueue(2)
    expect(player.queue.map((s) => s.id)).toEqual([1, 3])
    expect(player.currentId).toBe(1)
    expect(api.fetchSongUrl).toHaveBeenCalledTimes(1)
  })

  it('移除正在播放的歌曲时立即播放同位置的下一首', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2), song(3)], 2)
    await flush()
    player.removeFromQueue(2)
    await flush()
    expect(player.currentId).toBe(3)
    expect(engine.load).toHaveBeenLastCalledWith('https://cdn/3.mp3', 0)
    expect(player.status).toBe(PlayStatus.Playing)
  })

  it('移除最后一首且正在播放时回退到上一首', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2)], 2)
    await flush()
    player.removeFromQueue(2)
    await flush()
    expect(player.currentId).toBe(1)
  })

  it('暂停状态下移除当前歌曲只切换，不自动播放', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2)])
    await flush()
    player.pause()
    player.removeFromQueue(1)
    expect(player.currentId).toBe(2)
    expect(player.status).toBe(PlayStatus.Paused)
    expect(engine.stop).toHaveBeenCalled()
    expect(api.fetchSongUrl).toHaveBeenCalledTimes(1)
  })

  it('移除唯一一首后进入 idle', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1)])
    await flush()
    player.removeFromQueue(1)
    expect(player.queue).toEqual([])
    expect(player.currentId).toBeNull()
    expect(player.status).toBe(PlayStatus.Idle)
  })

  it('清空队列后停止播放', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2)])
    await flush()
    player.clearQueue()
    expect(player.queue).toEqual([])
    expect(player.currentSong).toBeNull()
    expect(player.status).toBe(PlayStatus.Idle)
    expect(engine.stop).toHaveBeenCalled()
  })

  it('下一首播放：插到当前歌曲之后并去重', async () => {
    const player = usePlayerStore()
    player.playSongs([song(1), song(2), song(3), song(4)], 2)
    await flush()
    player.insertNext([song(4), song(5), song(2)])
    expect(player.queue.map((s) => s.id)).toEqual([1, 2, 4, 5, 3])
    player.next()
    expect(player.currentId).toBe(4)
  })

  it('下一首播放在随机模式下同样生效', async () => {
    const player = usePlayerStore()
    player.setMode(PlayMode.Shuffle)
    player.playSongs([song(1), song(2), song(3), song(4)], 1)
    await flush()
    player.insertNext([song(9)])
    player.next()
    expect(player.currentId).toBe(9)
  })

  it('没有当前歌曲时下一首播放会直接开始播放', async () => {
    const player = usePlayerStore()
    player.insertNext([song(7)])
    await flush()
    expect(player.currentId).toBe(7)
    expect(player.status).toBe(PlayStatus.Playing)
  })

  describe('拖拽排序', () => {
    it('移动到指定位置，当前歌曲保持不变', async () => {
      const player = usePlayerStore()
      player.playSongs(
        [1, 2, 3, 4, 5].map((id) => song(id)),
        2,
      )
      await flush()
      player.moveInQueue(5, 1)
      expect(player.queue.map((s) => s.id)).toEqual([1, 5, 2, 3, 4])
      player.moveInQueue(1, 4)
      expect(player.queue.map((s) => s.id)).toEqual([5, 2, 3, 4, 1])
      expect(player.currentId).toBe(2)
      expect(api.fetchSongUrl).toHaveBeenCalledTimes(1)
    })

    it('拖到当前歌曲下方后顺序播放的下一首就是它', async () => {
      const player = usePlayerStore()
      player.playSongs(
        [1, 2, 3, 4].map((id) => song(id)),
        1,
      )
      await flush()
      player.moveInQueue(4, 1)
      player.next()
      expect(player.currentId).toBe(4)
    })

    it('随机模式下拖到当前歌曲下方同样是下一首', async () => {
      const player = usePlayerStore()
      player.setMode(PlayMode.Shuffle)
      player.playSongs(
        [1, 2, 3, 4, 5, 6].map((id) => song(id)),
        3,
      )
      await flush()
      // 分别验证从当前歌曲上方、下方拖过来两种情况
      for (const target of [player.queue[0]!.id, player.queue.at(-1)!.id].filter(
        (id) => id !== 3,
      )) {
        const from = player.queue.findIndex((s) => s.id === target)
        const current = player.currentIndex
        // toIndex 是移除自身后的下标
        player.moveInQueue(target, from < current ? current : current + 1)
        expect(player.queue[player.currentIndex + 1]!.id).toBe(target)
        player.next()
        expect(player.currentId).toBe(target)
        player.prev()
      }
    })

    it('越界下标被夹到首尾，不存在的歌曲忽略', async () => {
      const player = usePlayerStore()
      player.playSongs([1, 2, 3].map((id) => song(id)))
      await flush()
      player.moveInQueue(1, 99)
      expect(player.queue.map((s) => s.id)).toEqual([2, 3, 1])
      player.moveInQueue(1, -5)
      expect(player.queue.map((s) => s.id)).toEqual([1, 2, 3])
      player.moveInQueue(42, 0)
      expect(player.queue.map((s) => s.id)).toEqual([1, 2, 3])
    })
  })
})
