import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import ShortcutRecorder from './ShortcutRecorder.vue'

function press(init: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init }))
}

describe('ShortcutRecorder', () => {
  it('点击后录制组合键，没有修饰键的按键被忽略', async () => {
    const wrapper = mount(ShortcutRecorder, {
      props: { modelValue: 'CommandOrControl+Alt+Space' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.text()).toContain('请按下组合键')

    press({ key: 'p', code: 'KeyP' })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()

    press({ key: 'p', code: 'KeyP', ctrlKey: true, shiftKey: true })
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['CommandOrControl+Shift+P'])
  })

  it('Esc 取消录制且不修改', async () => {
    const wrapper = mount(ShortcutRecorder, { props: { modelValue: 'CommandOrControl+Alt+Space' } })
    await wrapper.find('button').trigger('click')
    press({ key: 'Escape', code: 'Escape' })
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).not.toContain('请按下组合键')
  })

  it('未录制时按键不受影响', async () => {
    const wrapper = mount(ShortcutRecorder, { props: { modelValue: 'CommandOrControl+Alt+Space' } })
    press({ key: 'p', code: 'KeyP', ctrlKey: true })
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })
})
