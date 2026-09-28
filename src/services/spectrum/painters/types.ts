export type PaintContext = {
  ctx: CanvasRenderingContext2D
  /** 画布像素尺寸（已乘 dpr） */
  width: number
  height: number
  dpr: number
  /** 已归一化到 0-1，左右镜像 */
  values: number[]
  fill: CanvasGradient | string
  glowColor: string
  /** 1-6，柱宽占比 */
  stroke: number
}

export type Painter = (context: PaintContext) => void

export function barWidthRatio(stroke: number) {
  return 0.3 + Math.min(Math.max(stroke, 1), 6) * 0.1
}
