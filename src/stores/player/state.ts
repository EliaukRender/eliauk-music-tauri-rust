import { computed, ref } from 'vue'

import { PlayMode, PlayStatus, SoundLevel } from '@/constants/player'
import type { Song, SongUrl } from '@/types/music'

export function createPlayerState() {
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
  /** 当前歌曲来自第三方音源（解灰） */
  const unblocked = ref(false)
  /** 低频写入，用于冷启动恢复进度 */
  const lastPosition = ref(0)
  const shuffleOrder = ref<number[]>([])
  /** 持久化只存队列 id，冷启动由 restore() 补全 */
  const pendingQueueIds = ref<number[]>([])

  const currentIndex = computed(() => queue.value.findIndex((s) => s.id === currentId.value))
  const currentSong = computed(() => queue.value[currentIndex.value] ?? null)
  const isPlaying = computed(() => status.value === PlayStatus.Playing)

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
    unblocked,
    lastPosition,
    shuffleOrder,
    pendingQueueIds,
    currentIndex,
    currentSong,
    isPlaying,
  }
}

export type PlayerState = ReturnType<typeof createPlayerState>
