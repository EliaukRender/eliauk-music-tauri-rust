import { describe, expect, it } from 'vitest'

import { createBandLayout, sampleBands } from '@/services/spectrum/bands'

describe('services/spectrum/bands', () => {
  it('频段按对数分布，低频段窄、高频段宽，且不包含 bin 0', () => {
    const layout = createBandLayout(512, 48000, 20)
    expect(layout.start[0]).toBeGreaterThanOrEqual(1)
    const width = (i: number) => layout.end[i]! - layout.start[i]!
    expect(width(19)).toBeGreaterThan(width(10))
    expect(layout.end[19]).toBeLessThanOrEqual(511)
  })

  it('柱数与 fftSize 无关', () => {
    const out = new Float32Array(16)
    for (const binCount of [32, 512]) {
      const layout = createBandLayout(binCount, 48000, 16)
      sampleBands(new Float32Array(binCount).fill(-30), layout, out)
      expect(out.every((v) => v > 0 && v <= 1)).toBe(true)
    }
  })

  it('静音（-Infinity）归零，过响夹到 1', () => {
    const layout = createBandLayout(128, 48000, 8)
    const out = new Float32Array(8)
    sampleBands(new Float32Array(128).fill(-Infinity), layout, out)
    expect(Array.from(out)).toEqual(new Array(8).fill(0))
    sampleBands(new Float32Array(128).fill(0), layout, out)
    expect(Array.from(out)).toEqual(new Array(8).fill(1))
  })

  it('灵敏度增益整体抬高柱高', () => {
    const layout = createBandLayout(512, 48000, 10)
    const base = new Float32Array(10)
    const boosted = new Float32Array(10)
    const data = new Float32Array(512).fill(-60)
    sampleBands(data, layout, base)
    sampleBands(data, layout, boosted, 10)
    expect(boosted.every((v, i) => v > base[i]!)).toBe(true)
  })

  it('同样电平下高频有倾斜补偿', () => {
    const layout = createBandLayout(512, 48000, 10)
    const out = new Float32Array(10)
    sampleBands(new Float32Array(512).fill(-60), layout, out)
    expect(out[9]).toBeGreaterThan(out[0]!)
  })
})
