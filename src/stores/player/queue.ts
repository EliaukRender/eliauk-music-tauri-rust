import { fetchSongDetail } from '@/api/modules/song'
import { PlayMode, PlayStatus } from '@/constants/player'
import { notify } from '@/services/notify'
import { createShuffleOrder } from '@/services/player/play-mode'
import type { Song } from '@/types/music'

import type { Playback } from './playback'
import type { PlayerState } from './state'

const UNPLAYABLE_HINT = '该歌曲暂无版权，可在设置中开启解灰'

/** 播放队列的增删与冷启动恢复 */
export function createQueueActions(
  state: PlayerState,
  playback: Playback,
  isPlayable: (song: Song) => boolean,
) {
  const { queue, currentId, currentIndex, currentSong, shuffleOrder, pendingQueueIds, status } =
    state

  /** 替换整个队列并播放；显式传入队列，避免浏览其他歌单时队列被覆盖 */
  function playSongs(songs: Song[], startId?: number) {
    const list = songs.filter(isPlayable)
    if (!list.length) {
      notify.warning('没有可播放的歌曲')
      return
    }
    if (startId !== undefined && !list.some((s) => s.id === startId)) {
      notify.warning(UNPLAYABLE_HINT)
      return
    }
    const ids = list.map((s) => s.id)
    const firstId =
      startId ??
      (state.mode.value === PlayMode.Shuffle ? createShuffleOrder(ids, null)[0]! : ids[0]!)
    queue.value = list
    pendingQueueIds.value = []
    shuffleOrder.value = createShuffleOrder(ids, firstId)
    playback.play(firstId)
  }

  /** 队列中已有则跳过去，没有则插到当前歌曲之后 */
  function playSong(song: Song) {
    if (!isPlayable(song)) {
      notify.warning(UNPLAYABLE_HINT)
      return
    }
    if (!queue.value.some((s) => s.id === song.id)) {
      queue.value.splice(currentIndex.value + 1, 0, song)
    }
    playback.play(song.id)
  }

  /** 移除当前歌曲时切到同位置的下一首（没有则上一首），原来在播放就继续播放 */
  function removeFromQueue(id: number) {
    const index = queue.value.findIndex((s) => s.id === id)
    if (index === -1) return
    const wasActive = status.value === PlayStatus.Playing || status.value === PlayStatus.Loading
    queue.value.splice(index, 1)
    shuffleOrder.value = shuffleOrder.value.filter((x) => x !== id)
    if (id !== currentId.value) return

    const fallback = queue.value[index] ?? queue.value[index - 1]
    if (!fallback) {
      clearQueue()
      return
    }
    if (wasActive) {
      void playback.loadSong(fallback.id)
      return
    }
    playback.stop()
    currentId.value = fallback.id
    state.duration.value = fallback.duration / 1000
    status.value = PlayStatus.Paused
  }

  function clearQueue() {
    playback.stop()
    queue.value = []
    currentId.value = null
    shuffleOrder.value = []
    pendingQueueIds.value = []
  }

  /** 插到当前歌曲之后，已在队列中的会被移动过来；没有当前歌曲时直接播放 */
  function insertNext(songs: Song[]) {
    const list = songs.filter((s) => isPlayable(s) && s.id !== currentId.value)
    if (!list.length) return
    if (!currentSong.value) {
      playSongs(list)
      return
    }
    const ids = new Set(list.map((s) => s.id))
    queue.value = queue.value.filter((s) => !ids.has(s.id))
    queue.value.splice(currentIndex.value + 1, 0, ...list)

    const order = shuffleOrder.value.filter((x) => !ids.has(x))
    order.splice(order.indexOf(currentSong.value.id) + 1, 0, ...ids)
    shuffleOrder.value = order
  }

  /** 冷启动恢复队列与当前歌曲，不自动播放；失败时保留 id 供下次重试 */
  async function restore() {
    const ids = pendingQueueIds.value
    if (!ids.length || queue.value.length) return
    try {
      const songs = await fetchSongDetail(ids)
      if (queue.value.length) return
      queue.value = songs.filter(isPlayable)
      pendingQueueIds.value = []
      if (!queue.value.some((s) => s.id === currentId.value)) {
        currentId.value = queue.value[0]?.id ?? null
        state.lastPosition.value = 0
      }
      shuffleOrder.value = createShuffleOrder(
        queue.value.map((s) => s.id),
        currentId.value,
      )
      state.duration.value = (currentSong.value?.duration ?? 0) / 1000
      status.value = currentSong.value ? PlayStatus.Paused : PlayStatus.Idle
    } catch (error) {
      console.warn('[player] 恢复播放队列失败', error)
    }
  }

  return { playSongs, playSong, removeFromQueue, clearQueue, insertNext, restore }
}
