export type PaintContext = {
  ctx: CanvasRenderingContext2D
  /** 绘制区域像素尺寸（已乘 dpr）；开启倒影时 height 不含倒影区 */
  width: number
  height: number
  dpr: number
  /** 已归一化到 0-1，按布局排好顺序 */
  values: Float32Array
  /** 峰值帽位置，与 values 一一对应；为 null 时不画 */
  peaks: Float32Array | null
  /** 时域采样（-1~1），仅波形样式使用 */
  waveform: Float32Array | null
  fill: CanvasGradient | string
  glowColor: string
  /** 1-6，柱宽占比；波形和曲线样式作为线宽 */
  stroke: number
  rounded: boolean
}

export type Painter = (context: PaintContext) => void

export function barWidthRatio(stroke: number) {
  return 0.3 + Math.min(Math.max(stroke, 1), 6) * 0.1
}

/** 峰值帽厚度与离柱顶的间距（CSS 像素） */
export const PEAK_CAP_HEIGHT = 2
export const PEAK_CAP_GAP = 2
/** 低于该值不画峰值帽，避免静音时底部残留一排横线 */
export const PEAK_CAP_MIN = 0.02
