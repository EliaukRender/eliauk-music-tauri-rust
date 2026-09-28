import { defineStore } from 'pinia'
import { ref } from 'vue'

import { AppEvent, type PlayerCommand } from '@/constants/events'
import { listenCurrent } from '@/services/tauri/events'
import { notifyMiniReady, sendToMain } from '@/services/tauri/mini'
import type { MiniPlayerState, MiniSong } from '@/types/mini'

/** mini 窗口的只读镜像，不持久化；所有操作以指令形式转发给主窗口 */
export const useMiniStore = defineStore('mini', () => {
  const state = ref<MiniPlayerState>({
    song: null,
    isPlaying: false,
    liked: false,
    loggedIn: false,
  })
  const queue = ref<MiniSong[]>([])

  /** 先监听再通知主窗口，避免错过首次推送；返回取消监听函数 */
  async function connect() {
    const offs = await Promise.all([
      listenCurrent<MiniPlayerState>(AppEvent.MiniState, (payload) => (state.value = payload)),
      listenCurrent<MiniSong[]>(AppEvent.MiniQueue, (payload) => (queue.value = payload)),
    ])
    await notifyMiniReady()
    return () => offs.forEach((off) => off())
  }

  function send(command: PlayerCommand) {
    void sendToMain(command)
  }

  return { state, queue, connect, send }
})
