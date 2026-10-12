import { type BandLayout, createBandLayout, sampleBands } from './bands'

/** 从 analyser 读取频域数据并聚合为 bandCount 段；频段布局按 binCount/采样率/段数缓存 */
export function createBandSource() {
  let freqDb = new Float32Array(0)
  let out = new Float32Array(0)
  let layout: BandLayout | null = null
  let layoutKey = ''

  return function read(analyser: AnalyserNode, bandCount: number, gainDb: number) {
    const sampleRate = analyser.context.sampleRate
    const key = `${analyser.frequencyBinCount}@${sampleRate}x${bandCount}`
    if (key !== layoutKey) {
      if (freqDb.length !== analyser.frequencyBinCount) {
        freqDb = new Float32Array(analyser.frequencyBinCount)
      }
      if (out.length !== bandCount) out = new Float32Array(bandCount)
      layout = createBandLayout(freqDb.length, sampleRate, bandCount)
      layoutKey = key
    }
    analyser.getFloatFrequencyData(freqDb)
    sampleBands(freqDb, layout!, out, gainDb)
    return out
  }
}
