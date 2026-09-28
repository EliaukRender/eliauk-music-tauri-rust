import { barWidthRatio, type Painter } from './types'

/** 经典：底部对齐的柱状图 */
export const drawBars: Painter = ({ ctx, width, height, values, fill, stroke }) => {
  const step = width / values.length
  const barWidth = step * barWidthRatio(stroke)
  ctx.fillStyle = fill
  values.forEach((value, i) => {
    const barHeight = value * height
    ctx.fillRect(i * step + (step - barWidth) / 2, height - barHeight, barWidth, barHeight)
  })
}
