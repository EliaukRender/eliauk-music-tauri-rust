export const SpectrumMode = {
  None: 'none',
  Bars: 'bars',
  LightBars: 'light-bars',
  DoubleBars: 'double-bars',
  Curve: 'curve',
  Wave: 'wave',
  Ring: 'ring',
} as const
export type SpectrumMode = (typeof SpectrumMode)[keyof typeof SpectrumMode]

export const spectrumModes: { mode: SpectrumMode; label: string }[] = [
  { mode: SpectrumMode.None, label: '关闭' },
  { mode: SpectrumMode.Bars, label: '经典' },
  { mode: SpectrumMode.LightBars, label: '荧光' },
  { mode: SpectrumMode.DoubleBars, label: '对称' },
  { mode: SpectrumMode.Curve, label: '曲线' },
  { mode: SpectrumMode.Wave, label: '波形' },
  { mode: SpectrumMode.Ring, label: '环形' },
]

/** 各样式支持的调节项，设置面板据此禁用无效选项 */
export type SpectrumFeatures = {
  /** 基于频段（柱数、灵敏度、布局） */
  bands: boolean
  /** 柱状（柱宽、圆角） */
  bars: boolean
  peakCaps: boolean
  reflection: boolean
  layout: boolean
}

const BAR_FEATURES: SpectrumFeatures = {
  bands: true,
  bars: true,
  peakCaps: true,
  reflection: true,
  layout: true,
}

export const spectrumFeatures: Record<Exclude<SpectrumMode, 'none'>, SpectrumFeatures> = {
  [SpectrumMode.Bars]: BAR_FEATURES,
  [SpectrumMode.LightBars]: BAR_FEATURES,
  [SpectrumMode.DoubleBars]: { ...BAR_FEATURES, reflection: false },
  [SpectrumMode.Curve]: { ...BAR_FEATURES, bars: false, peakCaps: false },
  [SpectrumMode.Wave]: {
    bands: false,
    bars: false,
    peakCaps: false,
    reflection: false,
    layout: false,
  },
  // 环形绕一圈天然对称，固定镜像布局
  [SpectrumMode.Ring]: { ...BAR_FEATURES, reflection: false, layout: false },
}

export const SpectrumLayout = {
  /** 低频居中，向两侧递增 */
  Mirror: 'mirror',
  /** 从左到右低频到高频 */
  Linear: 'linear',
} as const
export type SpectrumLayout = (typeof SpectrumLayout)[keyof typeof SpectrumLayout]

export const spectrumLayouts: { layout: SpectrumLayout; label: string }[] = [
  { layout: SpectrumLayout.Mirror, label: '居中镜像' },
  { layout: SpectrumLayout.Linear, label: '从左到右' },
]

export const GradientDirection = {
  Horizontal: 'horizontal',
  Vertical: 'vertical',
} as const
export type GradientDirection = (typeof GradientDirection)[keyof typeof GradientDirection]

export type SpectrumColors = [string, string, string, string]

/** 沿用旧项目的 8 套预设 */
export const spectrumPresets: { id: string; colors: SpectrumColors }[] = [
  { id: '1', colors: ['#00cc65', '#87f7a2', '#007c39', '#00cc65'] },
  { id: '2', colors: ['#93ba71', '#bed478', '#f0c8d4', '#f8e89b'] },
  { id: '3', colors: ['#84b488', '#bbe1af', '#94d380', '#cae442'] },
  { id: '4', colors: ['#f4b556', '#f5e77e', '#9bbae6', '#e5eef0'] },
  { id: '5', colors: ['#8ab4d2', '#aecfe3', '#dceef4', '#f7f5d6'] },
  { id: '6', colors: ['#ebe6a6', '#ffe5a7', '#ffdb6d', '#fdecca'] },
  { id: '7', colors: ['#9adcb5', '#aae0dd', '#bce6ca', '#caecea'] },
  { id: '8', colors: ['#f779ba', '#ffa5c3', '#ffdcd1', '#ffbfbe'] },
]

/** 画面上可见的柱子总数；镜像布局下每侧各占一半 */
export const BAR_COUNT_MIN = 32
export const BAR_COUNT_MAX = 128
export const BAR_COUNT_STEP = 16
export const DEFAULT_BAR_COUNT = 80

/** 灵敏度 1-5，每档平移 5dB */
export const SENSITIVITY_MIN = 1
export const SENSITIVITY_MAX = 5
export const DEFAULT_SENSITIVITY = 3

/** 频段按对数聚合后柱数与 fftSize 无关，固定取较大值保证低频分辨率（48kHz 下约 23Hz/bin） */
export const SPECTRUM_FFT_SIZE = 2048

/** 环形画布相对唱片的放大倍数，歌词页按此设置画布外扩、painter 按此推算唱片半径 */
export const RING_CANVAS_SCALE = 1.4
