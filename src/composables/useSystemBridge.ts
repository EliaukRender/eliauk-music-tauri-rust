import { computed, onScopeDispose, watch } from 'vue'

import type { PlayerCommand } from '@/constants/events'
import { onPlayerCommand, syncTrayState } from '@/services/tauri/system-bridge'
import { usePlayerStore } from '@/stores/player'
import { joinArtists } from '@/utils/format'

/** 主窗口与系统层（托盘等）的双向同步：接收播放指令，推送播放状态 */
export function useSystemBridge() {
  const player = usePlayerStore()

  const handlers: Record<PlayerCommand['type'], () => void> = {
    toggle: () => void player.toggle(),
    prev: () => player.prev(),
    next: () => player.next(),
  }

  let unlisten: (() => void) | undefined
  let disposed = false
  void onPlayerCommand((command) => handlers[command.type]?.()).then((fn) => {
    if (disposed) fn()
    else unlisten = fn
  })
  onScopeDispose(() => {
    disposed = true
    unlisten?.()
  })

  const trayState = computed(() => ({
    title: player.currentSong?.name ?? null,
    artist: player.currentSong ? joinArtists(player.currentSong.artists) : null,
    isPlaying: player.isPlaying,
  }))

  watch(
    trayState,
    (state, previous) => {
      if (
        previous &&
        state.title === previous.title &&
        state.artist === previous.artist &&
        state.isPlaying === previous.isPlaying
      ) {
        return
      }
      syncTrayState(state).catch((error) => console.warn('[system-bridge] 托盘同步失败', error))
    },
    { immediate: true },
  )
}
