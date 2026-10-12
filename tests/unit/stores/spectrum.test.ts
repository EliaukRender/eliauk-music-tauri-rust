import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { SpectrumLayout } from '@/constants/spectrum'
import { useSpectrumStore } from '@/stores/spectrum'

describe('stores/spectrum', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('选择预设后自定义颜色会清除预设标记', () => {
    const store = useSpectrumStore()
    store.applyPreset('8')
    expect(store.presetId).toBe('8')
    expect(store.colors[0]).toBe('#f779ba')
    store.setColor(0, '#000000')
    expect(store.presetId).toBeNull()
    expect(store.colors).toEqual(['#000000', '#ffa5c3', '#ffdcd1', '#ffbfbe'])
  })

  it('手动选择配色会关闭跟随封面', () => {
    const store = useSpectrumStore()
    store.followCover = true
    store.applyPreset('2')
    expect(store.followCover).toBe(false)
    store.followCover = true
    store.setColor(1, '#ffffff')
    expect(store.followCover).toBe(false)
  })

  it('各项设置同步到渲染配置，峰值帽默认开启', () => {
    const store = useSpectrumStore()
    expect(store.options.peakCaps).toBe(true)
    store.peakCaps = false
    store.layout = SpectrumLayout.Linear
    store.barCount = 48
    store.sensitivity = 5
    expect(store.options).toMatchObject({
      peakCaps: false,
      layout: SpectrumLayout.Linear,
      barCount: 48,
      sensitivity: 5,
    })
  })
})
