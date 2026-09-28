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

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Alt', 'Shift', 'CapsLock', 'Fn'])

const ACCELERATOR_KEYS: Record<string, string> = {
  ' ': 'Space',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
}

/**
 * 把按键事件转成 Tauri accelerator（如 CommandOrControl+Alt+Space）。
 * 全局快捷键至少要有一个修饰键，否则会吞掉普通输入；不满足时返回 null
 */
export function eventToAccelerator(
  event: KeyEventLike & Pick<KeyboardEvent, 'code'>,
  isMac: boolean,
): string | null {
  if (MODIFIER_KEYS.has(event.key)) return null
  const parts: string[] = []
  if (isMac ? event.metaKey : event.ctrlKey) parts.push('CommandOrControl')
  if (isMac && event.ctrlKey) parts.push('Control')
  if (event.altKey) parts.push('Alt')
  if (event.shiftKey) parts.push('Shift')
  if (!parts.length) return null
  // Alt/Option 组合会改变 event.key（如 ⌥+A 得到 å），字母数字改用 code
  const fromCode = event.code.match(/^(?:Key|Digit)(\w)$/)?.[1]
  const key = fromCode ?? ACCELERATOR_KEYS[event.key] ?? normalizeKey(event.key)
  return [...parts, key].join('+')
}

/** accelerator 转为 formatHotkey 使用的写法后展示 */
export function formatAccelerator(accelerator: string, isMac: boolean): string {
  const map: Record<string, string> = {
    CommandOrControl: 'Mod',
    Control: 'Ctrl',
    Left: 'ArrowLeft',
    Right: 'ArrowRight',
    Up: 'ArrowUp',
    Down: 'ArrowDown',
  }
  return formatHotkey(
    accelerator
      .split('+')
      .map((part) => map[part] ?? part)
      .join('+'),
    isMac,
  )
}
