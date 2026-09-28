import { computed, onScopeDispose, watch } from 'vue'

import { AppEvent } from '@/constants/events'
import { listenCurrent, sendToMini } from '@/services/tauri/mini'
import { useLikeStore } from '@/stores/like'
import { usePlayerStore } from '@/stores/player'
import { useUserStore } from '@/stores/user'
import type { MiniPlayerState, MiniSong } from '@/types/mini'
import type { Song } from '@/types/music'
import { joinArtists, resizeImage } from '@/utils/format'

function toMiniSong(song: Song): MiniSong {
  return {
    id: song.id,
    name: song.name,
    artist: joinArtists(song.artists),
    cover: song.album.picUrl ? resizeImage(song.album.picUrl, 128) : '',
  }
}

/**
 * 主窗口侧：主窗口是唯一数据源，mini 只做展示。
 * mini 懒创建，收到 MiniReady 之前不推送，避免无谓的序列化
 */
export function useMiniBridge() {
  const player = usePlayerStore()
  const like = useLikeStore()
  const user = useUserStore()
  let miniReady = false

  const state = computed<MiniPlayerState>(() => ({
    song: player.currentSong ? toMiniSong(player.currentSong) : null,
    isPlaying: player.isPlaying,
    liked: player.currentSong ? like.isLiked(player.currentSong.id) : false,
    loggedIn: user.isLoggedIn,
  }))

  const pushState = () => void sendToMini(AppEvent.MiniState, state.value)
  const pushQueue = () => void sendToMini(AppEvent.MiniQueue, player.queue.map(toMiniSong))

  watch(state, () => miniReady && pushState(), { deep: true })
  // 队列可能有数千首，只在内容变化时推送
  watch(
    () => player.queue.map((s) => s.id).join(','),
    () => miniReady && pushQueue(),
  )

  let unlisten: (() => void) | undefined
  let disposed = false
  void listenCurrent(AppEvent.MiniReady, () => {
    miniReady = true
    pushState()
    pushQueue()
  }).then((fn) => {
    if (disposed) fn()
    else unlisten = fn
  })
  onScopeDispose(() => {
    disposed = true
    unlisten?.()
  })
}
