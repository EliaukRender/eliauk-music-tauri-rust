import { watch } from 'vue'

import { useHistoryStore } from '@/stores/history'
import { usePlayerStore } from '@/stores/player'

/**
 * 歌曲真正开始播放时写入播放历史；暂停后继续、单曲循环重播不重复记录。
 * 只在主窗口挂载，mini 窗口不写入
 */
export function usePlayHistory() {
  const player = usePlayerStore()
  const history = useHistoryStore()
  let recordedId: number | null = null

  watch(
    () => [player.currentId, player.isPlaying] as const,
    ([id, playing]) => {
      if (!playing || id === null || id === recordedId || !player.currentSong) return
      recordedId = id
      history.record(player.currentSong)
    },
  )
}
