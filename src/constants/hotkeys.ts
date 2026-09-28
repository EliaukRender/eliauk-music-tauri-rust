/** Mod 在 macOS 为 Cmd，其他平台为 Ctrl */
export const HotkeyAction = {
  TogglePlay: 'toggle-play',
  Prev: 'prev',
  Next: 'next',
  SeekBackward: 'seek-backward',
  SeekForward: 'seek-forward',
  VolumeUp: 'volume-up',
  VolumeDown: 'volume-down',
  ToggleLike: 'toggle-like',
  ToggleMaximize: 'toggle-maximize',
  ToggleFullscreen: 'toggle-fullscreen',
  Escape: 'escape',
} as const
export type HotkeyAction = (typeof HotkeyAction)[keyof typeof HotkeyAction]

export type HotkeyDefinition = {
  action: HotkeyAction
  keys: string
  label: string
  /** macOS 上的组合键，缺省同 keys */
  macKeys?: string
  /** macOS 上由系统菜单处理，应用只做展示，不注册 */
  macSystem?: boolean
}

export const appHotkeys: HotkeyDefinition[] = [
  { action: HotkeyAction.TogglePlay, keys: 'Space', label: '播放 / 暂停' },
  { action: HotkeyAction.Prev, keys: 'Mod+ArrowLeft', label: '上一首' },
  { action: HotkeyAction.Next, keys: 'Mod+ArrowRight', label: '下一首' },
  { action: HotkeyAction.SeekBackward, keys: 'ArrowLeft', label: '快退 5 秒' },
  { action: HotkeyAction.SeekForward, keys: 'ArrowRight', label: '快进 5 秒' },
  { action: HotkeyAction.VolumeUp, keys: 'Mod+ArrowUp', label: '音量增大' },
  { action: HotkeyAction.VolumeDown, keys: 'Mod+ArrowDown', label: '音量减小' },
  { action: HotkeyAction.ToggleLike, keys: 'Mod+L', label: '喜欢 / 取消喜欢' },
  { action: HotkeyAction.ToggleMaximize, keys: 'Mod+Enter', label: '最大化 / 还原窗口' },
  {
    action: HotkeyAction.ToggleFullscreen,
    keys: 'F11',
    macKeys: 'Ctrl+Mod+F',
    macSystem: true,
    label: '全屏 / 退出全屏',
  },
  { action: HotkeyAction.Escape, keys: 'Escape', label: '退出全屏 / 收起歌词' },
]

/** 音量快捷键步长 */
export const VOLUME_STEP = 10
