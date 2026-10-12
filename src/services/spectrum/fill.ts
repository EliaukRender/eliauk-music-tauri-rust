import { GradientDirection, SpectrumMode } from '@/constants/spectrum'

import { ringGeometry } from './painters/ring'

export type FillOptions = {
  mode: Exclude<SpectrumMode, 'none'>
  colors: readonly string[]
  gradient: boolean
  direction: GradientDirection
}

function addStops(gradient: CanvasGradient, colors: readonly string[]) {
  const last = Math.max(colors.length - 1, 1)
  colors.forEach((color, i) => gradient.addColorStop(i / last, color))
  return gradient
}

/** 首尾回到第一个颜色，用于两端对称或首尾相接的渐变 */
function symmetric(colors: readonly string[]) {
  return [...colors, ...colors.slice(0, -1).reverse()]
}

/**
 * 按样式生成填充：环形水平方向用沿圆周的锥形渐变、垂直方向用由内向外的径向渐变；
 * 对称样式的垂直渐变以中线为轴上下对称
 */
export function createFill(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  dpr: number,
  options: FillOptions,
): CanvasGradient | string {
  const { mode, colors, gradient, direction } = options
  if (!gradient) return colors[0] ?? '#fff'
  const vertical = direction === GradientDirection.Vertical

  if (mode === SpectrumMode.Ring) {
    const { cx, cy, inner, outer } = ringGeometry(width, height, dpr)
    return vertical
      ? addStops(ctx.createRadialGradient(cx, cy, inner, cx, cy, outer), colors)
      : addStops(ctx.createConicGradient(-Math.PI / 2, cx, cy), symmetric(colors))
  }
  if (!vertical) return addStops(ctx.createLinearGradient(0, 0, width, 0), colors)
  if (mode === SpectrumMode.DoubleBars || mode === SpectrumMode.Wave) {
    return addStops(ctx.createLinearGradient(0, 0, 0, height), symmetric([...colors].reverse()))
  }
  return addStops(ctx.createLinearGradient(0, height, 0, 0), colors)
}
