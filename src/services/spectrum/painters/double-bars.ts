import { barWidthRatio, type Painter } from './types'

/** 对称：以垂直中线为轴上下延伸 */
export const drawDoubleBars: Painter = ({ ctx, width, height, values, fill, stroke }) => {
  const step = width / values.length
  const barWidth = step * barWidthRatio(stroke)
  const middle = height / 2
  ctx.fillStyle = fill
  values.forEach((value, i) => {
    const barHeight = Math.max(value * height * 0.9, 1)
    ctx.fillRect(i * step + (step - barWidth) / 2, middle - barHeight / 2, barWidth, barHeight)
  })
}
