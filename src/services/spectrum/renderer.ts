import { type SpectrumColors, SpectrumMode } from '@/constants/spectrum'

import { drawBars } from './painters/bars'
import { drawDoubleBars } from './painters/double-bars'
import { drawLightBars } from './painters/light-bars'
import type { Painter } from './painters/types'

export type SpectrumOptions = {
  mode: SpectrumMode
  colors: SpectrumColors
  stroke: number
  gradient: boolean
}

const painters: Record<Exclude<SpectrumMode, 'none'>, Painter> = {
  [SpectrumMode.Bars]: drawBars,
  [SpectrumMode.LightBars]: drawLightBars,
  [SpectrumMode.DoubleBars]: drawDoubleBars,
}

/** 高频段几乎没有能量，只取前 70% 的频点，避免右半边长期为空 */
const USED_BIN_RATIO = 0.7

/** 取低频到高频的数据并左右镜像，归一化到 0-1 */
export function toMirroredValues(data: Uint8Array): number[] {
  const count = Math.max(Math.floor(data.length * USED_BIN_RATIO), 1)
  const half: number[] = []
  for (let i = 0; i < count; i++) half.push(data[i]! / 255)
  return [...half.slice().reverse(), ...half]
}

export function createGradient(
  ctx: CanvasRenderingContext2D,
  width: number,
  colors: readonly string[],
): CanvasGradient {
  const gradient = ctx.createLinearGradient(0, 0, width, 0)
  colors.forEach((color, i) => gradient.addColorStop(i / Math.max(colors.length - 1, 1), color))
  return gradient
}

/** 每个实例只维护一个 rAF 循环；getAnalyser 返回 null 时（尚未播放）只清屏 */
export function createSpectrumRenderer(
  canvas: HTMLCanvasElement,
  getAnalyser: () => AnalyserNode | null,
  initial: SpectrumOptions,
) {
  const ctx = canvas.getContext('2d')!
  let options = initial
  let rafId = 0
  let dpr = 1
  let fill: CanvasGradient | string | null = null
  let data = new Uint8Array(0)

  function resize() {
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    fill = null
  }

  function frame() {
    rafId = requestAnimationFrame(frame)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const analyser = getAnalyser()
    if (!analyser || options.mode === SpectrumMode.None || !canvas.width) return

    if (data.length !== analyser.frequencyBinCount) {
      data = new Uint8Array(analyser.frequencyBinCount)
    }
    analyser.getByteFrequencyData(data)
    fill ??= options.gradient
      ? createGradient(ctx, canvas.width, options.colors)
      : options.colors[0]
    painters[options.mode]({
      ctx,
      width: canvas.width,
      height: canvas.height,
      dpr,
      values: toMirroredValues(data),
      fill,
      glowColor: options.colors[1],
      stroke: options.stroke,
    })
  }

  return {
    start() {
      if (!rafId) rafId = requestAnimationFrame(frame)
    },
    stop() {
      cancelAnimationFrame(rafId)
      rafId = 0
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
    update(next: SpectrumOptions) {
      options = next
      fill = null
    },
    resize,
  }
}
