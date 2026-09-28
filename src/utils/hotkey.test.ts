import { describe, expect, it } from 'vitest'

import {
  eventToAccelerator,
  formatAccelerator,
  formatHotkey,
  isKeyboardCaptureTarget,
  matchHotkey,
} from './hotkey'

const key = (
  k: string,
  mods: Partial<Record<'meta' | 'ctrl' | 'alt' | 'shift', boolean>> = {},
) => ({
  key: k,
  metaKey: !!mods.meta,
  ctrlKey: !!mods.ctrl,
  altKey: !!mods.alt,
  shiftKey: !!mods.shift,
})

describe('utils/hotkey', () => {
  it('Mod 在 macOS 对应 Cmd，在其他平台对应 Ctrl', () => {
    expect(matchHotkey(key('ArrowRight', { meta: true }), 'Mod+ArrowRight', true)).toBe(true)
    expect(matchHotkey(key('ArrowRight', { ctrl: true }), 'Mod+ArrowRight', true)).toBe(false)
    expect(matchHotkey(key('ArrowRight', { ctrl: true }), 'Mod+ArrowRight', false)).toBe(true)
    expect(matchHotkey(key('ArrowRight', { meta: true }), 'Mod+ArrowRight', false)).toBe(false)
  })

  it('修饰键必须完全匹配', () => {
    expect(matchHotkey(key('ArrowLeft'), 'ArrowLeft', true)).toBe(true)
    expect(matchHotkey(key('ArrowLeft', { meta: true }), 'ArrowLeft', true)).toBe(false)
    expect(matchHotkey(key('l', { meta: true, shift: true }), 'Mod+L', true)).toBe(false)
  })

  it('支持显式 Ctrl 与 Mod 组合', () => {
    expect(matchHotkey(key('f', { ctrl: true, meta: true }), 'Ctrl+Mod+F', true)).toBe(true)
    expect(matchHotkey(key('f', { meta: true }), 'Ctrl+Mod+F', true)).toBe(false)
  })

  it('空格与字母大小写归一化', () => {
    expect(matchHotkey(key(' '), 'Space', false)).toBe(true)
    expect(matchHotkey(key('l', { ctrl: true }), 'Mod+L', false)).toBe(true)
  })

  it('识别输入控件与滑块', () => {
    const input = document.createElement('input')
    const div = document.createElement('div')
    const editable = document.createElement('div')
    editable.setAttribute('contenteditable', 'true')
    const child = document.createElement('span')
    editable.appendChild(child)
    expect(isKeyboardCaptureTarget(input)).toBe(true)
    expect(isKeyboardCaptureTarget(child)).toBe(true)
    expect(isKeyboardCaptureTarget(div)).toBe(false)
    div.setAttribute('role', 'slider')
    expect(isKeyboardCaptureTarget(div)).toBe(true)
    expect(isKeyboardCaptureTarget(null)).toBe(false)
  })

  it('按平台格式化展示', () => {
    expect(formatHotkey('Mod+ArrowLeft', true)).toBe('⌘←')
    expect(formatHotkey('Mod+ArrowLeft', false)).toBe('Ctrl + ←')
    expect(formatHotkey('Space', false)).toBe('Space')
    expect(formatHotkey('Ctrl+Mod+F', true)).toBe('⌃⌘F')
  })

  it('按键事件转换为 accelerator', () => {
    const event = (k: string, code: string, mods: Parameters<typeof key>[1] = {}) => ({
      ...key(k, mods),
      code,
    })
    expect(eventToAccelerator(event(' ', 'Space', { meta: true, alt: true }), true)).toBe(
      'CommandOrControl+Alt+Space',
    )
    expect(eventToAccelerator(event('ArrowLeft', 'ArrowLeft', { ctrl: true }), false)).toBe(
      'CommandOrControl+Left',
    )
    // macOS 上 ⌥+P 得到的 key 是 π，按 code 取字母
    expect(eventToAccelerator(event('π', 'KeyP', { meta: true, alt: true }), true)).toBe(
      'CommandOrControl+Alt+P',
    )
    expect(eventToAccelerator(event('a', 'KeyA'), true)).toBeNull()
    expect(eventToAccelerator(event('Meta', 'MetaLeft', { meta: true }), true)).toBeNull()
  })

  it('accelerator 按平台展示', () => {
    expect(formatAccelerator('CommandOrControl+Alt+Left', true)).toBe('⌘⌥←')
    expect(formatAccelerator('CommandOrControl+Alt+Space', false)).toBe('Ctrl + Alt + Space')
  })
})
