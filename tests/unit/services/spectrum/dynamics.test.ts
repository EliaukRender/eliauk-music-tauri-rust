import { describe, expect, it } from 'vitest'

import { createDynamics } from '@/services/spectrum/dynamics'

describe('services/spectrum/dynamics', () => {
  it('上升立即跟随，下降按时间缓慢回落', () => {
    const d = createDynamics(1)
    d.step(new Float32Array([1]), 0.016)
    expect(d.levels[0]).toBe(1)
    d.step(new Float32Array([0]), 0.1)
    expect(d.levels[0]).toBeGreaterThan(0.7)
    expect(d.levels[0]).toBeLessThan(1)
  })

  it('峰值帽先保持再加速下落，且不低于柱高', () => {
    const d = createDynamics(1)
    d.step(new Float32Array([1]), 0.016)
    d.step(new Float32Array([0]), 0.2)
    expect(d.peaks[0]).toBe(1)
    for (let i = 0; i < 20; i++) d.step(new Float32Array([0]), 0.016)
    expect(d.peaks[0]).toBeLessThan(1)
    expect(d.peaks[0]).toBeGreaterThanOrEqual(d.levels[0]!)
  })

  it('静音输入下最终归零，可据此结束归零动画', () => {
    const d = createDynamics(4)
    d.step(new Float32Array([1, 0.5, 0.8, 0.2]), 0.016)
    expect(d.isIdle()).toBe(false)
    for (let i = 0; i < 200 && !d.isIdle(); i++) d.step(null, 0.016)
    expect(d.isIdle()).toBe(true)
  })
})
