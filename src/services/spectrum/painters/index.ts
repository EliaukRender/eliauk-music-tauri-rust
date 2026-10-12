import { SpectrumMode } from '@/constants/spectrum'

import { drawBars } from './bars'
import { drawCurve } from './curve'
import { drawDoubleBars } from './double-bars'
import { drawLightBars } from './light-bars'
import { drawRing } from './ring'
import type { Painter } from './types'
import { drawWave } from './wave'

export const painters: Record<Exclude<SpectrumMode, 'none'>, Painter> = {
  [SpectrumMode.Bars]: drawBars,
  [SpectrumMode.LightBars]: drawLightBars,
  [SpectrumMode.DoubleBars]: drawDoubleBars,
  [SpectrumMode.Curve]: drawCurve,
  [SpectrumMode.Wave]: drawWave,
  [SpectrumMode.Ring]: drawRing,
}
