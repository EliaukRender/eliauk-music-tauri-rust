import { type MaybeRefOrGetter, ref, toValue } from 'vue'

import { notify } from '@/services/notify'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistStore } from '@/stores/playlist'

/** 卡片上的「播放全部」：经 playlist store 取歌（带缓存）后替换播放队列 */
export function usePlaylistPlayback(playlistId: MaybeRefOrGetter<number>) {
  const player = usePlayerStore()
  const playlist = usePlaylistStore()
  const loading = ref(false)

  async function playAll() {
    if (loading.value) return
    loading.value = true
    try {
      player.playSongs((await playlist.fetchDetail(toValue(playlistId))).songs)
    } catch (error) {
      notify.error(`歌单加载失败：${(error as Error).message}`)
    } finally {
      loading.value = false
    }
  }

  return { loading, playAll }
}
