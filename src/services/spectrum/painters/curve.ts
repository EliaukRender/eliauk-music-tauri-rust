import { tracePoints } from './shapes'
import type { Painter } from './types'

const AREA_ALPHA = 0.35

/** 曲线：频段顶点连成平滑曲线，下方半透明填充 */
export const drawCurve: Painter = ({ ctx, width, height, dpr, values, fill, stroke }) => {
  const n = values.length
  const step = width / n
  const lineWidth = (0.5 + stroke * 0.5) * dpr
  const maxHeight = height - lineWidth
  const xs = (i: number) => (i + 0.5) * step
  const ys = (i: number) => height - values[i]! * maxHeight

  const line = new Path2D()
  line.moveTo(0, ys(0))
  tracePoints(line, xs, ys, n)
  line.lineTo(width, ys(n - 1))

  const area = new Path2D(line)
  area.lineTo(width, height)
  area.lineTo(0, height)
  area.closePath()

  ctx.save()
  ctx.fillStyle = fill
  ctx.globalAlpha = AREA_ALPHA
  ctx.fill(area)
  ctx.globalAlpha = 1
  ctx.strokeStyle = fill
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.stroke(line)
  ctx.restore()
}
