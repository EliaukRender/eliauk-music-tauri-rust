import { describe, expect, it } from 'vitest'

import { toMirroredValues } from './renderer'

describe('services/spectrum/renderer', () => {
  it('取低频部分并左右镜像、归一化', () => {
    const data = new Uint8Array([255, 128, 0, 0, 0, 0, 0, 0, 0, 0])
    const values = toMirroredValues(data)
    expect(values).toHaveLength(14)
    expect(values[6]).toBe(1)
    expect(values[7]).toBe(1)
    expect(values[5]).toBeCloseTo(128 / 255)
    expect(values).toEqual([...values].reverse())
  })

  it('空数据也至少返回一对值', () => {
    expect(toMirroredValues(new Uint8Array(1))).toEqual([0, 0])
  })
})
