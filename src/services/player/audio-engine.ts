import { DEFAULT_FFT_SIZE } from '@/constants/spectrum'
import { logger } from '@/services/logger'

type MediaEvent = keyof HTMLMediaElementEventMap

/** 开始播放后等待多久采样频谱，用于判断是否因 CORS 被静音 */
const SILENCE_CHECK_DELAY = 1500
const SILENCE_CHECK_FRAMES = 5

/**
 * 全局唯一的播放层，不依赖 Pinia。
 * createMediaElementSource 对同一个 element 只能调用一次，所以只保留一个 audio，切歌只改 src。
 */
class AudioEngine {
  readonly audio: HTMLAudioElement
  private context: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private gain: GainNode | null = null
  private volume = 1
  private muted = false
  /** 元数据就绪前设置 currentTime 在 WebKit 上不可靠，延后到 loadedmetadata */
  private pendingStart = 0
  private fftSize: number = DEFAULT_FFT_SIZE
  /** 已判定过的 CDN 域名，每个域名只检测一次 */
  private checkedHosts = new Set<string>()

  constructor() {
    this.audio = new Audio()
    // 不设置时媒体被视为跨域不透明资源，AnalyserNode 只能拿到全 0 数据
    this.audio.crossOrigin = 'anonymous'
    this.audio.preload = 'auto'
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.pendingStart > 0) this.audio.currentTime = this.pendingStart
      this.pendingStart = 0
    })
    this.audio.addEventListener('playing', () => this.scheduleSilenceCheck())
  }

  get currentTime() {
    return this.pendingStart || this.audio.currentTime
  }

  get duration() {
    const { duration } = this.audio
    return Number.isFinite(duration) ? duration : 0
  }

  get paused() {
    return this.audio.paused
  }

  get hasSource() {
    return !!this.audio.getAttribute('src')
  }

  on<K extends MediaEvent>(type: K, listener: (event: HTMLMediaElementEventMap[K]) => void) {
    this.audio.addEventListener(type, listener)
    return () => this.audio.removeEventListener(type, listener)
  }

  load(url: string, startAt = 0) {
    this.pendingStart = startAt
    this.audio.src = url
  }

  /** 自动播放策略要求在用户手势内创建或恢复 AudioContext */
  async play() {
    this.ensureGraph()
    if (this.context?.state === 'suspended') await this.context.resume()
    await this.audio.play()
  }

  pause() {
    this.audio.pause()
  }

  stop() {
    this.pendingStart = 0
    this.audio.pause()
    this.audio.removeAttribute('src')
    this.audio.load()
  }

  seek(time: number) {
    if (this.audio.readyState < HTMLMediaElement.HAVE_METADATA) {
      this.pendingStart = Math.max(time, 0)
      return
    }
    this.audio.currentTime = Math.min(Math.max(time, 0), this.duration || Infinity)
  }

  /** @param volume 0-1 */
  setVolume(volume: number) {
    this.volume = Math.min(Math.max(volume, 0), 1)
    this.applyVolume()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    this.applyVolume()
  }

  /** 只读取，不创建：AudioContext 必须在用户手势（play）中创建，否则会以挂起状态接管输出 */
  getAnalyser() {
    return this.analyser
  }

  setFftSize(size: number) {
    this.fftSize = size
    if (this.analyser) this.analyser.fftSize = size
  }

  /**
   * 媒体跨域且没有 CORS 授权时 MediaElementSource 输出静音，频谱全为 0。
   * 目前 CDN 都带 CORS 头，这里只记录日志，出现实际案例再实现 Rust 代理降级（见 06 文档）
   */
  private scheduleSilenceCheck() {
    const analyser = this.analyser
    const host = this.hostOf(this.audio.currentSrc)
    if (!analyser || !host || this.checkedHosts.has(host)) return
    const startTime = this.audio.currentTime
    setTimeout(async () => {
      if (this.audio.paused || this.hostOf(this.audio.currentSrc) !== host) return
      if (this.audio.currentTime <= startTime) return
      this.checkedHosts.add(host)
      const data = new Uint8Array(analyser.frequencyBinCount)
      for (let i = 0; i < SILENCE_CHECK_FRAMES; i++) {
        analyser.getByteFrequencyData(data)
        if (data.some((v) => v > 0)) return
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      logger.warn(`[audio-engine] 频谱数据全为 0，疑似 ${host} 未返回 CORS 头`)
    }, SILENCE_CHECK_DELAY)
  }

  private hostOf(url: string) {
    try {
      return new URL(url).host
    } catch {
      return ''
    }
  }

  private applyVolume() {
    const level = this.muted ? 0 : this.volume
    // 接入 Web Audio 后由 gain 控制音量，element 保持满音量，频谱数据不随音量衰减
    if (this.gain) {
      this.gain.gain.value = level
      this.audio.volume = 1
    } else {
      this.audio.volume = level
    }
  }

  private ensureGraph() {
    if (this.context || typeof AudioContext === 'undefined') return
    try {
      const context = new AudioContext()
      const source = context.createMediaElementSource(this.audio)
      const analyser = context.createAnalyser()
      analyser.fftSize = this.fftSize
      const gain = context.createGain()
      source.connect(analyser)
      analyser.connect(gain)
      gain.connect(context.destination)
      this.context = context
      this.analyser = analyser
      this.gain = gain
      this.applyVolume()
    } catch (error) {
      console.warn('[audio-engine] Web Audio 初始化失败，降级为直接播放', error)
    }
  }
}

export type { AudioEngine }

export const audioEngine = new AudioEngine()
