import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Song } from '@/types/music'

export type PlayMode = 'sequence' | 'shuffle' | 'repeat-one'

/** 播放器状态骨架，播放逻辑按 docs/功能方案/02-播放核心.md 实施 */
export const usePlayerStore = defineStore(
  'player',
  () => {
    const currentSong = ref<Song | null>(null)
    const queue = ref<Song[]>([])
    const isPlaying = ref(false)
    const playMode = ref<PlayMode>('sequence')
    /** 0-100 */
    const volume = ref(60)

    return { currentSong, queue, isPlaying, playMode, volume }
  },
  { persist: { pick: ['playMode', 'volume'] } },
)
