import { useEventListener } from '@vueuse/core'

import {
  appHotkeys,
  HotkeyAction as Action,
  type HotkeyAction,
  VOLUME_STEP,
} from '@/constants/hotkeys'
import { exitFullscreen, toggleFullscreen, toggleMaximizeWindow } from '@/services/tauri/window'
import { useAppStore } from '@/stores/app'
import { useLikeStore } from '@/stores/like'
import { useLyricStore } from '@/stores/lyric'
import { usePlayerStore } from '@/stores/player'
import { isKeyboardCaptureTarget, matchHotkey } from '@/utils/hotkey'
import { usesCommandKey } from '@/utils/platform'

/** 应用内快捷键，挂载在主窗口布局上 */
export function useHotkeys() {
  const app = useAppStore()
  const player = usePlayerStore()
  const like = useLikeStore()
  const lyric = useLyricStore()

  const handlers: Record<HotkeyAction, () => void> = {
    [Action.TogglePlay]: () => void player.toggle(),
    [Action.Prev]: () => player.prev(),
    [Action.Next]: () => player.next(),
    [Action.SeekBackward]: () => player.backward(),
    [Action.SeekForward]: () => player.forward(),
    [Action.VolumeUp]: () => player.setVolume(player.volume + VOLUME_STEP),
    [Action.VolumeDown]: () => player.setVolume(player.volume - VOLUME_STEP),
    [Action.ToggleLike]: () => {
      if (player.currentSong) void like.toggle(player.currentSong.id)
    },
    [Action.ToggleMaximize]: () => void toggleMaximizeWindow(),
    [Action.ToggleFullscreen]: () => void toggleFullscreen(),
    // 逐层退出：全屏 → 歌词页 → 播放队列
    [Action.Escape]: () => {
      if (app.isFullscreen) void exitFullscreen()
      else if (lyric.visible) lyric.visible = false
      else if (app.queueDrawerVisible) app.queueDrawerVisible = false
    },
  }

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.isComposing || event.repeat || isKeyboardCaptureTarget(event.target)) return
    const hotkey = appHotkeys.find(
      (h) =>
        !(usesCommandKey && h.macSystem) &&
        matchHotkey(event, usesCommandKey ? (h.macKeys ?? h.keys) : h.keys, usesCommandKey),
    )
    if (!hotkey) return
    // 阻止空格触发聚焦按钮的点击、滚动页面等默认行为
    event.preventDefault()
    handlers[hotkey.action]()
  })
}
