import { addBar } from './shapes'
import { barWidthRatio, type Painter, PEAK_CAP_GAP, PEAK_CAP_HEIGHT, PEAK_CAP_MIN } from './types'

/** 经典：底部对齐的柱状图 + 峰值帽 */
export const drawBars: Painter = (context) => {
  const { ctx, width, height, dpr, values, peaks, fill, stroke, rounded } = context
  const step = width / values.length
  const barWidth = step * barWidthRatio(stroke)
  const capHeight = PEAK_CAP_HEIGHT * dpr
  const capGap = PEAK_CAP_GAP * dpr
  const maxHeight = height - capHeight - capGap
  // 柱子和峰值帽合并为一条路径一次填充，荧光样式的阴影也只计算一次
  const path = new Path2D()
  for (let i = 0; i < values.length; i++) {
    const x = i * step + (step - barWidth) / 2
    const barHeight = values[i]! * maxHeight
    addBar(path, x, height - barHeight, barWidth, barHeight, rounded, dpr)
    if (peaks && peaks[i]! > PEAK_CAP_MIN) {
      const capBottom = height - peaks[i]! * maxHeight - capGap
      addBar(path, x, capBottom - capHeight, barWidth, capHeight, rounded, dpr, 'all')
    }
  }
  ctx.fillStyle = fill
  ctx.fill(path)
}
