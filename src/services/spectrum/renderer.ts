import {
  DEFAULT_SENSITIVITY,
  type GradientDirection,
  type SpectrumColors,
  spectrumFeatures,
  SpectrumLayout,
  SpectrumMode,
} from '@/constants/spectrum'

import { createBandSource } from './band-source'
import { createDynamics } from './dynamics'
import { createFill } from './fill'
import { painters } from './painters'
import type { PaintContext } from './painters/types'
import { drawReflection, REFLECTION_RATIO } from './reflection'

export type SpectrumOptions = {
  mode: SpectrumMode
  layout: SpectrumLayout
  colors: SpectrumColors
  gradient: boolean
  gradientDirection: GradientDirection
  stroke: number
  rounded: boolean
  reflection: boolean
  peakCaps: boolean
  /** 可见柱子总数 */
  barCount: number
  sensitivity: number
}

/** 首帧或切回前台时 rAF 间隔可能很大，夹住避免柱子瞬间归零 */
const MAX_FRAME_DT = 0.05
const DB_PER_SENSITIVITY = 5

/** 低频放中间、向两侧递增高频，写入长度为 2 * half.length 的 out */
export function mirrorInto(half: Float32Array, out: Float32Array) {
  const n = half.length
  for (let i = 0; i < n; i++) {
    out[n - 1 - i] = half[i]!
    out[n + i] = half[i]!
  }
}

/** 镜像布局下每侧只需要一半频段 */
export function resolveBandCount(options: Pick<SpectrumOptions, 'mode' | 'layout' | 'barCount'>) {
  const mirrored = isMirrored(options)
  return Math.max(mirrored ? Math.round(options.barCount / 2) : options.barCount, 1)
}

function isMirrored({ mode, layout }: Pick<SpectrumOptions, 'mode' | 'layout'>) {
  if (mode === SpectrumMode.None) return true
  return !spectrumFeatures[mode].layout || layout === SpectrumLayout.Mirror
}

/**
 * 每个实例只维护一个 rAF 循环。
 * stop() 先让柱子落回底部再停循环（波形样式直接停止）；halt() 立即停止并清屏
 */
export function createSpectrumRenderer(
  canvas: HTMLCanvasElement,
  getAnalyser: () => AnalyserNode | null,
  initial: SpectrumOptions,
) {
  const ctx = canvas.getContext('2d')!
  const readBands = createBandSource()
  let options = initial
  let bandCount = resolveBandCount(options)
  let dynamics = createDynamics(bandCount)
  let values = new Float32Array(bandCount * 2)
  let peakValues = new Float32Array(bandCount * 2)
  let waveform = new Float32Array(0)
  let rafId = 0
  let lastTime = 0
  let draining = false
  let dpr = 1
  let fill: CanvasGradient | string | null = null

  function resize() {
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.round(canvas.clientWidth * dpr)
    canvas.height = Math.round(canvas.clientHeight * dpr)
    fill = null
  }

  function resetBands() {
    bandCount = resolveBandCount(options)
    dynamics = createDynamics(bandCount)
    values = new Float32Array(bandCount * 2)
    peakValues = new Float32Array(bandCount * 2)
  }

  /** 按布局排列柱高；镜像时写入预分配缓冲区，否则直接返回 dynamics 的数组 */
  function arrange(source: Float32Array, target: Float32Array) {
    if (!isMirrored(options)) return source
    mirrorInto(source, target)
    return target
  }

  function readWaveform(analyser: AnalyserNode | null) {
    if (!analyser) return null
    if (waveform.length !== analyser.fftSize) waveform = new Float32Array(analyser.fftSize)
    analyser.getFloatTimeDomainData(waveform)
    return waveform
  }

  function frame(time: number) {
    const dt = lastTime ? Math.min((time - lastTime) / 1000, MAX_FRAME_DT) : 0
    lastTime = time
    const { mode } = options
    if (mode === SpectrumMode.None || (draining && mode === SpectrumMode.Wave)) {
      halt()
      return
    }
    const analyser = draining ? null : getAnalyser()
    const features = spectrumFeatures[mode]
    if (features.bands) {
      const gainDb = (options.sensitivity - DEFAULT_SENSITIVITY) * DB_PER_SENSITIVITY
      dynamics.step(analyser ? readBands(analyser, bandCount, gainDb) : null, dt)
      if (draining && dynamics.isIdle()) {
        halt()
        return
      }
    }
    rafId = requestAnimationFrame(frame)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!canvas.width || !canvas.height) return

    const reflect = options.reflection && features.reflection
    const height = reflect ? Math.round(canvas.height * (1 - REFLECTION_RATIO)) : canvas.height
    fill ??= createFill(ctx, canvas.width, height, dpr, {
      mode,
      colors: options.colors,
      gradient: options.gradient,
      direction: options.gradientDirection,
    })
    const context: PaintContext = {
      ctx,
      width: canvas.width,
      height,
      dpr,
      values: features.bands ? arrange(dynamics.levels, values) : values,
      peaks: features.peakCaps && options.peakCaps ? arrange(dynamics.peaks, peakValues) : null,
      waveform: mode === SpectrumMode.Wave ? readWaveform(analyser) : null,
      fill,
      glowColor: options.colors[1],
      stroke: options.stroke,
      rounded: options.rounded,
    }
    const paint = () => painters[mode](context)
    paint()
    if (reflect) drawReflection(ctx, canvas.width, height, canvas.height, paint)
  }

  function halt() {
    cancelAnimationFrame(rafId)
    rafId = 0
    lastTime = 0
    draining = false
    dynamics.reset()
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  return {
    start() {
      draining = false
      if (!rafId) rafId = requestAnimationFrame(frame)
    },
    stop() {
      if (rafId) draining = true
    },
    halt,
    update(next: SpectrumOptions) {
      options = next
      fill = null
      if (resolveBandCount(next) !== bandCount) resetBands()
    },
    resize,
  }
}
