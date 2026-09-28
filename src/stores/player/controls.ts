import { watch } from 'vue'

import { PlayMode } from '@/constants/player'
import { audioEngine } from '@/services/player/audio-engine'
import { createShuffleOrder } from '@/services/player/play-mode'

import type { PlayerState } from './state'

/** 音量、静音与播放模式 */
export function createControls(state: PlayerState) {
  const { volume, muted, mode } = state

  function setVolume(value: number) {
    volume.value = Math.min(Math.max(Math.round(value), 0), 100)
    if (volume.value > 0) muted.value = false
  }

  function toggleMute() {
    muted.value = !muted.value
  }

  function setMode(value: PlayMode) {
    mode.value = value
    if (value === PlayMode.Shuffle) {
      state.shuffleOrder.value = createShuffleOrder(
        state.queue.value.map((s) => s.id),
        state.currentId.value,
      )
    }
  }

  function cycleMode() {
    const modes = Object.values(PlayMode)
    setMode(modes[(modes.indexOf(mode.value) + 1) % modes.length]!)
  }

  /** 持久化恢复（$patch）同样会触发，保证引擎音量与状态一致 */
  function syncVolumeToEngine() {
    watch(
      [volume, muted],
      ([v, m]) => {
        audioEngine.setVolume(v / 100)
        audioEngine.setMuted(m)
      },
      { immediate: true },
    )
  }

  return { setVolume, toggleMute, setMode, cycleMode, syncVolumeToEngine }
}
