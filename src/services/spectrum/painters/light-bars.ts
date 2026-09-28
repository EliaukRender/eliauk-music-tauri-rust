import { drawBars } from './bars'
import type { Painter } from './types'

/** 荧光：经典柱状图加发光阴影 */
export const drawLightBars: Painter = (context) => {
  const { ctx, dpr, glowColor } = context
  ctx.save()
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 16 * dpr
  drawBars(context)
  ctx.restore()
}
