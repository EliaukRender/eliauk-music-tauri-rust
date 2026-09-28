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

/** 与 src-tauri/src/system/shortcuts.rs 的 GlobalAction 保持一致 */
export const GlobalAction = {
  TogglePlay: 'toggle-play',
  Prev: 'prev',
  Next: 'next',
  ToggleMini: 'toggle-mini',
} as const
export type GlobalAction = (typeof GlobalAction)[keyof typeof GlobalAction]

export const globalActionLabels: Record<GlobalAction, string> = {
  [GlobalAction.TogglePlay]: '播放 / 暂停',
  [GlobalAction.Prev]: '上一首',
  [GlobalAction.Next]: '下一首',
  [GlobalAction.ToggleMini]: '显示 / 隐藏 mini 播放器',
}

/** Tauri accelerator 格式 */
export const defaultGlobalShortcuts: Record<GlobalAction, string> = {
  [GlobalAction.TogglePlay]: 'CommandOrControl+Alt+Space',
  [GlobalAction.Prev]: 'CommandOrControl+Alt+Left',
  [GlobalAction.Next]: 'CommandOrControl+Alt+Right',
  [GlobalAction.ToggleMini]: 'CommandOrControl+Alt+M',
}
