import { tracePoints } from './shapes'
import type { Painter } from './types'

/** 每个采样点间隔的 CSS 像素，过密时曲线显得毛躁 */
const POINT_SPACING = 3

/** 波形：时域采样的示波器曲线 */
export const drawWave: Painter = ({
  ctx,
  width,
  height,
  dpr,
  waveform,
  fill,
  glowColor,
  stroke,
}) => {
  if (!waveform?.length) return
  const n = Math.max(Math.min(Math.floor(width / (POINT_SPACING * dpr)), waveform.length), 2)
  const sampleStep = waveform.length / n
  const middle = height / 2
  const lineWidth = (0.5 + stroke * 0.5) * dpr
  const amplitude = middle - lineWidth
  const xs = (i: number) => (i / (n - 1)) * width
  // 多路叠加或削波的音源可能超出 ±1，夹住避免画出画布
  const ys = (i: number) =>
    middle - Math.min(Math.max(waveform[Math.floor(i * sampleStep)]!, -1), 1) * amplitude

  const path = new Path2D()
  path.moveTo(xs(0), ys(0))
  tracePoints(path, xs, ys, n)

  ctx.save()
  ctx.strokeStyle = fill
  ctx.lineWidth = lineWidth
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 8 * dpr
  ctx.stroke(path)
  ctx.restore()
}
