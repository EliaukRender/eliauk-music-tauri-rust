import { describe, expect, it } from 'vitest'

import { pickPalette } from '@/services/spectrum/cover-palette'

function pixels(...colors: [number, number, number, number][]) {
  const data: number[] = []
  for (const [r, g, b, count] of colors) {
    for (let i = 0; i < count; i++) data.push(r, g, b, 255)
  }
  return new Uint8ClampedArray(data)
}

function hue(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  if (r! >= g! && r! >= b!) return 'red'
  if (b! >= r! && b! >= g!) return 'blue'
  return 'green'
}

describe('services/spectrum/cover-palette', () => {
  it('黑白封面返回 null', () => {
    expect(pickPalette(pixels([20, 20, 20, 500], [230, 230, 230, 500]))).toBeNull()
  })

  it('按占比排序，主色排第一', () => {
    const palette = pickPalette(pixels([200, 30, 30, 700], [30, 30, 200, 300]))!
    expect(palette).toHaveLength(4)
    expect(hue(palette[0])).toBe('red')
    expect(hue(palette[1])).toBe('blue')
  })

  it('深色封面提亮到可见区间', () => {
    const [first] = pickPalette(pixels([80, 10, 10, 1000]))!
    const r = parseInt(first.slice(1, 3), 16)
    expect(r).toBeGreaterThan(150)
  })
})
