export const SpectrumMode = {
  None: 'none',
  Bars: 'bars',
  LightBars: 'light-bars',
  DoubleBars: 'double-bars',
} as const
export type SpectrumMode = (typeof SpectrumMode)[keyof typeof SpectrumMode]

export const spectrumModes: { mode: SpectrumMode; label: string }[] = [
  { mode: SpectrumMode.None, label: '关闭' },
  { mode: SpectrumMode.Bars, label: '经典' },
  { mode: SpectrumMode.LightBars, label: '荧光' },
  { mode: SpectrumMode.DoubleBars, label: '对称' },
]

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

export const FFT_SIZES = [64, 128, 256, 512, 1024] as const
export type FftSize = (typeof FFT_SIZES)[number]

export const DEFAULT_FFT_SIZE: FftSize = 256
