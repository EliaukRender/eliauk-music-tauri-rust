import { defineStore } from 'pinia'
import { ref } from 'vue'

import type { Song } from '@/types/music'

/** 只存在本地，不区分账号 */
export const HISTORY_LIMIT = 500

export type HistoryEntry = {
  song: Song
  /** 毫秒时间戳 */
  playedAt: number
}

export const useHistoryStore = defineStore(
  'history',
  () => {
    /** 最近播放在前 */
    const entries = ref<HistoryEntry[]>([])

    /** 重复播放的歌曲移到最前，超出上限时丢弃最早的记录 */
    function record(song: Song, playedAt = Date.now()) {
      const rest = entries.value.filter((e) => e.song.id !== song.id)
      entries.value = [{ song, playedAt }, ...rest].slice(0, HISTORY_LIMIT)
    }

    function remove(id: number) {
      entries.value = entries.value.filter((e) => e.song.id !== id)
    }

    function clear() {
      entries.value = []
    }

    return { entries, record, remove, clear }
  },
  { persist: { pick: ['entries'] } },
)
