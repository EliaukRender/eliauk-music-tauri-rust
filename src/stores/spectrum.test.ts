import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const { engine } = vi.hoisted(() => ({ engine: { setFftSize: vi.fn() } }))
vi.mock('@/services/player/audio-engine', () => ({ audioEngine: engine }))

const { useSpectrumStore } = await import('./spectrum')

describe('stores/spectrum', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
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

  it('fftSize 变化时下发到音频引擎', async () => {
    const store = useSpectrumStore()
    expect(engine.setFftSize).toHaveBeenCalledWith(256)
    store.fftSize = 1024
    await nextTick()
    expect(engine.setFftSize).toHaveBeenLastCalledWith(1024)
  })
})
