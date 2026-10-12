import { describe, expect, it } from 'vitest'

import { SpectrumLayout, SpectrumMode } from '@/constants/spectrum'
import { mirrorInto, resolveBandCount } from '@/services/spectrum/renderer'

describe('services/spectrum/renderer', () => {
  it('低频放中间并左右镜像', () => {
    const out = new Float32Array(6)
    mirrorInto(new Float32Array([0.9, 0.5, 0.1]), out)
    expect(Array.from(out)).toEqual([0.1, 0.5, 0.9, 0.9, 0.5, 0.1].map(Math.fround))
  })

  it('镜像布局每侧取一半频段，从左到右布局取全部', () => {
    const base = { mode: SpectrumMode.Bars, barCount: 80 }
    expect(resolveBandCount({ ...base, layout: SpectrumLayout.Mirror })).toBe(40)
    expect(resolveBandCount({ ...base, layout: SpectrumLayout.Linear })).toBe(80)
  })

  it('环形样式不支持布局切换，始终镜像', () => {
    expect(
      resolveBandCount({ mode: SpectrumMode.Ring, barCount: 64, layout: SpectrumLayout.Linear }),
    ).toBe(32)
  })
})
