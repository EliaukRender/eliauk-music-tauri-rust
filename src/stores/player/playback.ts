import { useThrottleFn } from '@vueuse/core'

import { fetchSongUrl, fetchUnblockedUrl } from '@/api/modules/song'
import { PlayStatus, SEEK_STEP } from '@/constants/player'
import { notify } from '@/services/notify'
import { audioEngine } from '@/services/player/audio-engine'
import { pickNext, pickPrev, type PickResult } from '@/services/player/play-mode'
import type { Song } from '@/types/music'

import type { PlayerState } from './state'

/** 网易云音频地址约 20 分钟过期，提前刷新 */
const URL_TTL = 15 * 60 * 1000
/** 同一首歌媒体出错后重新取地址的最小间隔，防止坏地址无限重试 */
const RETRY_INTERVAL = 60 * 1000

type LoadOptions = { autoplay?: boolean; startAt?: number }

/** 加载、播放控制与引擎事件处理 */
export function createPlayback(state: PlayerState, isUnblockEnabled: () => boolean) {
  const { queue, currentId, status, duration, trial, unblocked, lastPosition, mode } = state

  // 切歌竞态：每次加载自增，异步步骤返回后比对，过期即丢弃
  let requestSeq = 0
  let urlFetchedAt = 0
  let lastRetry = { id: 0, at: 0 }
  /** 连续跳过的无版权歌曲数，达到队列长度即停止，避免死循环 */
  let skipStreak = 0

  async function loadSong(id: number, { autoplay = true, startAt = 0 }: LoadOptions = {}) {
    const seq = ++requestSeq
    const song = queue.value.find((s) => s.id === id)
    currentId.value = id
    status.value = PlayStatus.Loading
    trial.value = null
    unblocked.value = false
    duration.value = (song?.duration ?? 0) / 1000
    lastPosition.value = startAt
    audioEngine.pause()

    try {
      const result = await fetchSongUrl(id, state.level.value)
      if (seq !== requestSeq) return
      let url = result.url
      if (!url && isUnblockEnabled()) {
        url = await fetchUnblockedUrl(id)
        if (seq !== requestSeq) return
        unblocked.value = !!url
      }
      if (!url) {
        skipUnavailable(song)
        return
      }
      trial.value = unblocked.value ? null : result.trial
      urlFetchedAt = Date.now()
      audioEngine.load(url, startAt)
      if (!autoplay) {
        status.value = PlayStatus.Paused
        return
      }
      await audioEngine.play()
      if (seq !== requestSeq) return
      skipStreak = 0
      status.value = PlayStatus.Playing
    } catch (error) {
      if (seq !== requestSeq) return
      handlePlayError(error)
    }
  }

  function handlePlayError(error: unknown) {
    if (error instanceof DOMException) {
      // 被新的 src 打断
      if (error.name === 'AbortError') return
      // 自动播放策略拦截，等待用户手动点击播放
      if (error.name === 'NotAllowedError') {
        status.value = PlayStatus.Paused
        return
      }
    }
    status.value = PlayStatus.Error
    notify.error(`播放失败：${(error as Error).message}`)
  }

  function skipUnavailable(song: Song | undefined) {
    skipStreak++
    if (skipStreak >= queue.value.length) {
      skipStreak = 0
      status.value = PlayStatus.Error
      notify.warning('队列中没有可播放的歌曲')
      return
    }
    const reason = isUnblockEnabled() ? '暂无版权且未匹配到其他音源' : '暂无版权'
    notify.warning(`《${song?.name ?? currentId.value}》${reason}，已跳过`)
    playPicked(pick(true))
  }

  function pick(manual: boolean, direction: 'next' | 'prev' = 'next') {
    const ctx = {
      ids: queue.value.map((s) => s.id),
      currentId: currentId.value,
      mode: mode.value,
      shuffleOrder: state.shuffleOrder.value,
    }
    return direction === 'next' ? pickNext(ctx, manual) : pickPrev(ctx)
  }

  function playPicked(result: PickResult) {
    state.shuffleOrder.value = result.shuffleOrder
    if (result.id === null) {
      stop()
      return
    }
    // 单曲循环且地址未过期时直接重播，不重新请求
    if (result.id === currentId.value && isUrlFresh()) {
      audioEngine.seek(0)
      audioEngine.play().then(() => (status.value = PlayStatus.Playing), handlePlayError)
      return
    }
    void loadSong(result.id)
  }

  function isUrlFresh() {
    return audioEngine.hasSource && Date.now() - urlFetchedAt < URL_TTL
  }

  async function toggle() {
    if (status.value === PlayStatus.Loading) return
    if (status.value === PlayStatus.Playing) {
      pause()
      return
    }
    const id = currentId.value ?? queue.value[0]?.id
    if (id === undefined) return
    if (id !== currentId.value || status.value === PlayStatus.Error || !isUrlFresh()) {
      const startAt = audioEngine.hasSource ? audioEngine.currentTime : lastPosition.value
      await loadSong(id, { startAt })
      return
    }
    const seq = requestSeq
    try {
      await audioEngine.play()
      if (seq === requestSeq) status.value = PlayStatus.Playing
    } catch (error) {
      if (seq === requestSeq) handlePlayError(error)
    }
  }

  function pause() {
    audioEngine.pause()
    if (status.value === PlayStatus.Playing) status.value = PlayStatus.Paused
    lastPosition.value = audioEngine.currentTime
  }

  function stop() {
    requestSeq++
    audioEngine.stop()
    status.value = PlayStatus.Idle
    trial.value = null
    unblocked.value = false
    duration.value = 0
    lastPosition.value = 0
  }

  function next() {
    skipStreak = 0
    playPicked(pick(true))
  }

  function prev() {
    skipStreak = 0
    playPicked(pick(true, 'prev'))
  }

  function seek(time: number) {
    if (audioEngine.hasSource) {
      audioEngine.seek(time)
      lastPosition.value = audioEngine.currentTime
    } else {
      lastPosition.value = Math.min(Math.max(time, 0), duration.value)
    }
  }

  /** 只改进度，不改变播放状态 */
  function seekBy(delta: number) {
    const base = audioEngine.hasSource ? audioEngine.currentTime : lastPosition.value
    seek(base + delta)
  }

  /** 用户主动选歌时重新计算连续跳过次数 */
  function play(id: number) {
    skipStreak = 0
    void loadSong(id)
  }

  function bindEngineEvents() {
    const savePosition = useThrottleFn(() => {
      lastPosition.value = audioEngine.currentTime
    }, 5000)

    audioEngine.on('timeupdate', () => {
      if (status.value === PlayStatus.Playing) void savePosition()
    })
    audioEngine.on('durationchange', () => {
      if (audioEngine.duration) duration.value = audioEngine.duration
    })
    audioEngine.on('playing', () => {
      if (status.value === PlayStatus.Loading || status.value === PlayStatus.Paused) {
        status.value = PlayStatus.Playing
      }
    })
    // 系统层面的暂停（耳机拔出、媒体键等）
    audioEngine.on('pause', () => {
      if (status.value === PlayStatus.Playing) status.value = PlayStatus.Paused
    })
    audioEngine.on('ended', () => playPicked(pick(false)))
    audioEngine.on('error', () => {
      const id = currentId.value
      if (id === null || status.value === PlayStatus.Idle) return
      // 多数是地址过期，重新取一次地址并从原位置继续
      const now = Date.now()
      if (lastRetry.id !== id || now - lastRetry.at > RETRY_INTERVAL) {
        lastRetry = { id, at: now }
        void loadSong(id, {
          autoplay: status.value !== PlayStatus.Paused,
          startAt: audioEngine.currentTime,
        })
        return
      }
      status.value = PlayStatus.Error
      notify.error('歌曲加载失败')
    })
  }

  return {
    loadSong,
    play,
    toggle,
    pause,
    stop,
    next,
    prev,
    seek,
    seekBy,
    forward: () => seekBy(SEEK_STEP),
    backward: () => seekBy(-SEEK_STEP),
    bindEngineEvents,
  }
}

export type Playback = ReturnType<typeof createPlayback>
