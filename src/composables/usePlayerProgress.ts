import { onScopeDispose, ref, watch } from 'vue'

import { audioEngine } from '@/services/player/audio-engine'
import { usePlayerStore } from '@/stores/player'

/** 播放进度是高频数据，不进 store，组件按需直接订阅引擎 */
export function usePlayerProgress() {
  const player = usePlayerStore()
  const currentTime = ref(0)

  // 冷启动恢复后尚未加载音源，显示上次保存的进度
  const sync = () => {
    currentTime.value = audioEngine.hasSource ? audioEngine.currentTime : player.lastPosition
  }
  sync()

  const offs = (['timeupdate', 'seeked', 'emptied'] as const).map((type) =>
    audioEngine.on(type, sync),
  )
  watch(() => player.lastPosition, sync)
  onScopeDispose(() => offs.forEach((off) => off()))

  return { currentTime }
}
