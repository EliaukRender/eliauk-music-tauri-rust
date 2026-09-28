type KeyEventLike = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'altKey' | 'shiftKey'>

function normalizeKey(key: string) {
  if (key === ' ') return 'Space'
  return key.length === 1 ? key.toUpperCase() : key
}

/**
 * 组合键必须完全匹配：未声明的修饰键按下时不触发，避免 Cmd+Shift+L 误触 Cmd+L。
 * @param keys 形如 'Mod+Shift+L'；Mod 在 macOS 为 Cmd，其他平台为 Ctrl，也可以显式写 Ctrl / Meta
 */
export function matchHotkey(event: KeyEventLike, keys: string, isMac: boolean): boolean {
  const parts = keys.split('+')
  const key = parts.pop()!
  const mods = new Set(parts)
  const needCtrl = mods.has('Ctrl') || (!isMac && mods.has('Mod'))
  const needMeta = mods.has('Meta') || (isMac && mods.has('Mod'))
  return (
    normalizeKey(event.key) === normalizeKey(key) &&
    event.ctrlKey === needCtrl &&
    event.metaKey === needMeta &&
    event.altKey === mods.has('Alt') &&
    event.shiftKey === mods.has('Shift')
  )
}

/** 焦点在输入控件或滑块中时不响应快捷键，按键交给控件自身处理 */
export function isKeyboardCaptureTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return !!target.closest('input, textarea, select, [contenteditable="true"], [role="slider"]')
}

export function formatHotkey(keys: string, isMac: boolean): string {
  const names: Record<string, string> = isMac
    ? {
        Mod: '⌘',
        Meta: '⌘',
        Ctrl: '⌃',
        Alt: '⌥',
        Shift: '⇧',
        ArrowLeft: '←',
        ArrowRight: '→',
        ArrowUp: '↑',
        ArrowDown: '↓',
        Enter: '↩',
        Escape: 'Esc',
      }
    : { Mod: 'Ctrl', ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Escape: 'Esc' }
  return keys
    .split('+')
    .map((part) => names[part] ?? part)
    .join(isMac ? '' : ' + ')
}
