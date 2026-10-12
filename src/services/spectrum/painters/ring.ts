import { RING_CANVAS_SCALE } from '@/constants/spectrum'

import { barWidthRatio, type Painter, PEAK_CAP_GAP, PEAK_CAP_HEIGHT, PEAK_CAP_MIN } from './types'

/** 柱根离唱片边缘的间距（CSS 像素） */
const RING_GAP = 6

export function ringGeometry(width: number, height: number, dpr: number) {
  const outer = Math.min(width, height) / 2
  const inner = outer / RING_CANVAS_SCALE + RING_GAP * dpr
  return { cx: width / 2, cy: height / 2, inner, outer }
}

/**
 * 环形：围绕唱片放射状排布，从正上方顺时针绘制。
 * 每根柱子是一条线段，整体合并为一条路径一次描边；圆角用 lineCap 实现
 */
export const drawRing: Painter = (context) => {
  const { ctx, width, height, dpr, values, peaks, fill, stroke, rounded } = context
  const { cx, cy, inner, outer } = ringGeometry(width, height, dpr)
  const n = values.length
  const angleStep = (Math.PI * 2) / n
  const thickness = ((Math.PI * 2 * inner) / n) * barWidthRatio(stroke)
  const capLength = PEAK_CAP_HEIGHT * dpr
  const capGap = PEAK_CAP_GAP * dpr
  // round cap 会在两端各外凸半个线宽
  const capOverflow = rounded ? thickness / 2 : 0
  const maxLength = outer - inner - capLength - capGap - capOverflow * 2

  const path = new Path2D()
  const segment = (angle: number, from: number, to: number) => {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    path.moveTo(cx + cos * from, cy + sin * from)
    path.lineTo(cx + cos * to, cy + sin * to)
  }
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i + 0.5) * angleStep
    const length = Math.max(values[i]! * maxLength, dpr)
    segment(angle, inner + capOverflow, inner + capOverflow + length)
    if (peaks && peaks[i]! > PEAK_CAP_MIN) {
      const start = inner + capOverflow + peaks[i]! * maxLength + capGap + capOverflow * 2
      segment(angle, start, start + capLength)
    }
  }
  ctx.save()
  ctx.strokeStyle = fill
  ctx.lineWidth = thickness
  ctx.lineCap = rounded ? 'round' : 'butt'
  ctx.stroke(path)
  ctx.restore()
}
