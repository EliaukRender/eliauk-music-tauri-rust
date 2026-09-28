import { onScopeDispose, watch } from 'vue'

import type { PlayerCommand } from '@/constants/events'
import { audioEngine } from '@/services/player/audio-engine'
import { onPlayerCommand, syncPlayerState } from '@/services/tauri/system-bridge'
import { usePlayerStore } from '@/stores/player'
import { joinArtists, resizeImage } from '@/utils/format'

type Handlers = {
  [K in PlayerCommand['type']]: (command: Extract<PlayerCommand, { type: K }>) => void
}

/** 主窗口与系统层（托盘、媒体中心）的双向同步：接收播放指令，推送播放状态 */
export function useSystemBridge() {
  const player = usePlayerStore()

  const handlers: Handlers = {
    toggle: () => void player.toggle(),
    play: () => {
      if (!player.isPlaying) void player.toggle()
    },
    pause: () => player.pause(),
    prev: () => player.prev(),
    next: () => player.next(),
    seek: ({ position }) => player.seek(position),
    'seek-by': ({ delta }) => player.seekBy(delta),
  }

  let unlisten: (() => void) | undefined
  let disposed = false
  void onPlayerCommand((command) => {
    const handler = handlers[command.type] as ((command: PlayerCommand) => void) | undefined
    handler?.(command)
  }).then((fn) => {
    if (disposed) fn()
    else unlisten = fn
  })

  function sync() {
    const song = player.currentSong
    syncPlayerState({
      title: song?.name ?? null,
      artist: song ? joinArtists(song.artists) : null,
      album: song?.album.name ?? null,
      coverUrl: song?.album.picUrl ? resizeImage(song.album.picUrl, 300) : null,
      duration: player.duration,
      position: audioEngine.currentTime,
      isPlaying: player.isPlaying,
    }).catch((error) => console.warn('[system-bridge] 播放状态同步失败', error))
  }

  // 进度由系统按播放状态外推，只在歌曲、播放状态、时长变化或跳转时同步
  watch(() => [player.currentId, player.isPlaying, player.duration] as const, sync, {
    immediate: true,
  })
  const offSeeked = audioEngine.on('seeked', sync)

  onScopeDispose(() => {
    disposed = true
    unlisten?.()
    offSeeked()
  })
}
