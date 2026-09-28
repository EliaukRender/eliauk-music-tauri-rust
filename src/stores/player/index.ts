import { defineStore } from 'pinia'

import type { Song } from '@/types/music'

import { useSettingsStore } from '../settings'
import { createControls } from './controls'
import { playerPersist } from './persist'
import { createPlayback } from './playback'
import { createQueueActions } from './queue'
import { createPlayerState } from './state'

/** 播放业务状态；各部分按职责拆在同目录模块中，这里只负责组装 */
export const usePlayerStore = defineStore(
  'player',
  () => {
    const settings = useSettingsStore()
    const state = createPlayerState()

    /** 开启解灰后，无版权歌曲也进入队列，播放时再尝试匹配 */
    function isPlayable(song: Song) {
      return !song.unavailable || settings.unblockEnabled
    }

    const playback = createPlayback(state, () => settings.unblockEnabled)
    const queueActions = createQueueActions(state, playback, isPlayable)
    const controls = createControls(state)

    controls.syncVolumeToEngine()
    playback.bindEngineEvents()

    // loadSong、bindEngineEvents 等只在内部使用，不对外暴露
    return {
      ...state,
      toggle: playback.toggle,
      pause: playback.pause,
      stop: playback.stop,
      next: playback.next,
      prev: playback.prev,
      seek: playback.seek,
      seekBy: playback.seekBy,
      forward: playback.forward,
      backward: playback.backward,
      ...queueActions,
      setVolume: controls.setVolume,
      toggleMute: controls.toggleMute,
      setMode: controls.setMode,
      cycleMode: controls.cycleMode,
      isPlayable,
    }
  },
  { persist: playerPersist },
)
