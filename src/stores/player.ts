import { useThrottleFn } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { fetchSongDetail, fetchSongUrl } from '@/api/modules/song'
import { PlayMode, PlayStatus, SEEK_STEP, SoundLevel } from '@/constants/player'
import { notify } from '@/services/notify'
import { audioEngine } from '@/services/player/audio-engine'
import {
  createShuffleOrder,
  pickNext,
  pickPrev,
  type PickResult,
} from '@/services/player/play-mode'
import type { Song, SongUrl } from '@/types/music'

/** 网易云音频地址约 20 分钟过期，提前刷新 */
const URL_TTL = 15 * 60 * 1000
/** 同一首歌媒体出错后重新取地址的最小间隔，防止坏地址无限重试 */
const RETRY_INTERVAL = 60 * 1000

type LoadOptions = { autoplay?: boolean; startAt?: number }

export const usePlayerStore = defineStore(
  'player',
  () => {
    const queue = ref<Song[]>([])
    const currentId = ref<number | null>(null)
    const status = ref<PlayStatus>(PlayStatus.Idle)
    /** 秒；试听时为片段时长 */
    const duration = ref(0)
    /** 0-100 */
    const volume = ref(60)
    const muted = ref(false)
    const mode = ref<PlayMode>(PlayMode.Sequence)
    const level = ref<SoundLevel>(SoundLevel.ExHigh)
    const trial = ref<SongUrl['trial']>(null)
    /** 低频写入，用于冷启动恢复进度 */
    const lastPosition = ref(0)
    const shuffleOrder = ref<number[]>([])
    /** 持久化只存队列 id，冷启动由 restore() 补全 */
    const pendingQueueIds = ref<number[]>([])

    const currentIndex = computed(() => queue.value.findIndex((s) => s.id === currentId.value))
    const currentSong = computed(() => queue.value[currentIndex.value] ?? null)
    const isPlaying = computed(() => status.value === PlayStatus.Playing)

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
      duration.value = (song?.duration ?? 0) / 1000
      lastPosition.value = startAt
      audioEngine.pause()

      try {
        const result = await fetchSongUrl(id, level.value)
        if (seq !== requestSeq) return
        if (!result.url) {
          skipUnavailable(song)
          return
        }
        trial.value = result.trial
        urlFetchedAt = Date.now()
        audioEngine.load(result.url, startAt)
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
      notify.warning(`《${song?.name ?? currentId.value}》暂无版权，已跳过`)
      playPicked(pick(true))
    }

    function pick(manual: boolean, direction: 'next' | 'prev' = 'next') {
      const ctx = {
        ids: queue.value.map((s) => s.id),
        currentId: currentId.value,
        mode: mode.value,
        shuffleOrder: shuffleOrder.value,
      }
      return direction === 'next' ? pickNext(ctx, manual) : pickPrev(ctx)
    }

    function playPicked(result: PickResult) {
      shuffleOrder.value = result.shuffleOrder
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

    /** 替换整个队列并播放；显式传入队列，避免浏览其他歌单时队列被覆盖 */
    function playSongs(songs: Song[], startId?: number) {
      const list = songs.filter((s) => !s.unavailable)
      if (!list.length) {
        notify.warning('没有可播放的歌曲')
        return
      }
      if (startId !== undefined && !list.some((s) => s.id === startId)) {
        notify.warning('该歌曲暂无版权')
        return
      }
      const ids = list.map((s) => s.id)
      const firstId =
        startId ?? (mode.value === PlayMode.Shuffle ? createShuffleOrder(ids, null)[0]! : ids[0]!)
      queue.value = list
      pendingQueueIds.value = []
      shuffleOrder.value = createShuffleOrder(ids, firstId)
      skipStreak = 0
      void loadSong(firstId)
    }

    /** 队列中已有则跳过去，没有则插到当前歌曲之后 */
    function playSong(song: Song) {
      if (song.unavailable) {
        notify.warning('该歌曲暂无版权')
        return
      }
      if (!queue.value.some((s) => s.id === song.id)) {
        queue.value.splice(currentIndex.value + 1, 0, song)
      }
      skipStreak = 0
      void loadSong(song.id)
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

    function forward() {
      seekBy(SEEK_STEP)
    }

    function backward() {
      seekBy(-SEEK_STEP)
    }

    function setVolume(value: number) {
      volume.value = Math.min(Math.max(Math.round(value), 0), 100)
      if (volume.value > 0) muted.value = false
    }

    function toggleMute() {
      muted.value = !muted.value
    }

    function setMode(value: PlayMode) {
      mode.value = value
      if (value === PlayMode.Shuffle) {
        shuffleOrder.value = createShuffleOrder(
          queue.value.map((s) => s.id),
          currentId.value,
        )
      }
    }

    function cycleMode() {
      const modes = Object.values(PlayMode)
      setMode(modes[(modes.indexOf(mode.value) + 1) % modes.length]!)
    }

    /** 冷启动恢复队列与当前歌曲，不自动播放；失败时保留 id 供下次重试 */
    async function restore() {
      const ids = pendingQueueIds.value
      if (!ids.length || queue.value.length) return
      try {
        const songs = await fetchSongDetail(ids)
        if (queue.value.length) return
        queue.value = songs.filter((s) => !s.unavailable)
        pendingQueueIds.value = []
        if (!queue.value.some((s) => s.id === currentId.value)) {
          currentId.value = queue.value[0]?.id ?? null
          lastPosition.value = 0
        }
        shuffleOrder.value = createShuffleOrder(
          queue.value.map((s) => s.id),
          currentId.value,
        )
        duration.value = (currentSong.value?.duration ?? 0) / 1000
        status.value = currentSong.value ? PlayStatus.Paused : PlayStatus.Idle
      } catch (error) {
        console.warn('[player] 恢复播放队列失败', error)
      }
    }

    watch(
      [volume, muted],
      ([v, m]) => {
        audioEngine.setVolume(v / 100)
        audioEngine.setMuted(m)
      },
      { immediate: true },
    )

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

    return {
      queue,
      currentId,
      status,
      duration,
      volume,
      muted,
      mode,
      level,
      trial,
      lastPosition,
      shuffleOrder,
      pendingQueueIds,
      currentIndex,
      currentSong,
      isPlaying,
      playSongs,
      playSong,
      toggle,
      pause,
      stop,
      next,
      prev,
      seek,
      seekBy,
      forward,
      backward,
      setVolume,
      toggleMute,
      setMode,
      cycleMode,
      restore,
    }
  },
  {
    persist: {
      pick: [
        'queue',
        'pendingQueueIds',
        'currentId',
        'volume',
        'muted',
        'mode',
        'level',
        'lastPosition',
      ],
      serializer: {
        serialize: ({ queue, pendingQueueIds, ...rest }) => {
          const ids = (queue as Song[]).map((s) => s.id)
          // restore 完成前队列为空，沿用待恢复的 id，避免被空队列覆盖
          return JSON.stringify({ ...rest, queueIds: ids.length ? ids : pendingQueueIds })
        },
        deserialize: (raw) => {
          const { queueIds, ...rest } = JSON.parse(raw) as { queueIds?: number[] }
          return { ...rest, pendingQueueIds: queueIds ?? [] }
        },
      },
    },
  },
)
