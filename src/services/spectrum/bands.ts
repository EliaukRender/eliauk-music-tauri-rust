const MIN_FREQ = 30
const MAX_FREQ = 16000
/** 归一化区间（dBFS），已含倾斜补偿 */
const MIN_DB = -80
const MAX_DB = -22
/** 音乐能量随频率衰减，按每倍频程 +3dB 补偿，以 1kHz 为基准 */
const TILT_DB_PER_OCTAVE = 3
/** >1 压低弱信号、拉开层次 */
const GAMMA = 1.3

export type BandLayout = {
  /** 每段覆盖的 bin 区间 [start, end)；窄于一个 bin 时 end - start <= 1，按 center 插值 */
  start: Uint16Array
  end: Uint16Array
  /** 段中心频率对应的小数 bin 位置 */
  center: Float32Array
  tilt: Float32Array
}

/** 按对数频率等分为 bandCount 段 */
export function createBandLayout(
  binCount: number,
  sampleRate: number,
  bandCount: number,
): BandLayout {
  const binHz = sampleRate / 2 / binCount
  const maxFreq = Math.min(MAX_FREQ, sampleRate / 2)
  const ratio = maxFreq / MIN_FREQ
  const edge = (i: number) => MIN_FREQ * ratio ** (i / bandCount)
  // 跳过 bin 0（直流分量）
  const toBin = (freq: number) => Math.min(Math.max(freq / binHz, 1), binCount - 1)

  const layout: BandLayout = {
    start: new Uint16Array(bandCount),
    end: new Uint16Array(bandCount),
    center: new Float32Array(bandCount),
    tilt: new Float32Array(bandCount),
  }
  for (let i = 0; i < bandCount; i++) {
    const low = edge(i)
    const high = edge(i + 1)
    const centerFreq = Math.sqrt(low * high)
    layout.start[i] = Math.ceil(toBin(low))
    layout.end[i] = Math.ceil(toBin(high))
    layout.center[i] = toBin(centerFreq)
    layout.tilt[i] = TILT_DB_PER_OCTAVE * Math.log2(centerFreq / 1000)
  }
  return layout
}

/** dB 数据按频段取峰值，补偿倾斜并叠加 gainDb（灵敏度）后归一化到 0-1 写入 out */
export function sampleBands(
  freqDb: Float32Array,
  layout: BandLayout,
  out: Float32Array,
  gainDb = 0,
) {
  for (let i = 0; i < out.length; i++) {
    const start = layout.start[i]!
    const end = layout.end[i]!
    let db: number
    if (end - start > 1) {
      db = -Infinity
      for (let bin = start; bin < end; bin++) db = Math.max(db, freqDb[bin]!)
    } else {
      // 低频段窄于一个 bin，线性插值避免相邻柱子等高形成台阶
      const pos = layout.center[i]!
      const lo = Math.floor(pos)
      const hi = Math.min(lo + 1, freqDb.length - 1)
      db = freqDb[lo]! + (freqDb[hi]! - freqDb[lo]!) * (pos - lo)
    }
    const norm = (db + layout.tilt[i]! + gainDb - MIN_DB) / (MAX_DB - MIN_DB)
    // 静音时 analyser 输出 -Infinity，norm 为 NaN 或负数，统一夹到 0
    out[i] = norm > 0 ? Math.min(norm, 1) ** GAMMA : 0
  }
}
