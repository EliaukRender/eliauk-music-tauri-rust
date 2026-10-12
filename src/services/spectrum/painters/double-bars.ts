import { addBar } from './shapes'
import { barWidthRatio, type Painter, PEAK_CAP_GAP, PEAK_CAP_HEIGHT, PEAK_CAP_MIN } from './types'

/** 对称：以水平中线为轴上下延伸，峰值帽在两端 */
export const drawDoubleBars: Painter = (context) => {
  const { ctx, width, height, dpr, values, peaks, fill, stroke, rounded } = context
  const step = width / values.length
  const barWidth = step * barWidthRatio(stroke)
  const middle = height / 2
  const capHeight = PEAK_CAP_HEIGHT * dpr
  const capGap = PEAK_CAP_GAP * dpr
  const maxHalf = height * 0.45 - capHeight - capGap
  const path = new Path2D()
  for (let i = 0; i < values.length; i++) {
    const x = i * step + (step - barWidth) / 2
    const half = Math.max(values[i]! * maxHalf, dpr / 2)
    addBar(path, x, middle - half, barWidth, half * 2, rounded, dpr, 'all')
    if (peaks && peaks[i]! > PEAK_CAP_MIN) {
      const offset = peaks[i]! * maxHalf + capGap
      addBar(path, x, middle - offset - capHeight, barWidth, capHeight, rounded, dpr, 'all')
      addBar(path, x, middle + offset, barWidth, capHeight, rounded, dpr, 'all')
    }
  }
  ctx.fillStyle = fill
  ctx.fill(path)
}
