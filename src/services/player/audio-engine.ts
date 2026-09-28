import { DEFAULT_FFT_SIZE } from '@/constants/spectrum'
import { logger } from '@/services/logger'

type MediaEvent = keyof HTMLMediaElementEventMap

/** 开始播放后等待多久采样频谱，用于判断是否因 CORS 被静音 */
const SILENCE_CHECK_DELAY = 1500
const SILENCE_CHECK_FRAMES = 5

/** 已确认返回 CORS 头的网易云音频 CDN */
const CORS_SAFE_HOST_RE = /(^|\.)music\.126\.net$/

/** 只有带 CORS 头的地址才能走 Web Audio；否则 crossOrigin 请求会直接失败 */
export function isCorsSafeUrl(url: string) {
  try {
    return CORS_SAFE_HOST_RE.test(new URL(url).hostname)
  } catch {
    return false
  }
}

function createAudio(cors: boolean) {
  const audio = new Audio()
  // 不设置时媒体被视为跨域不透明资源，AnalyserNode 只能拿到全 0 数据
  if (cors) audio.crossOrigin = 'anonymous'
  audio.preload = 'auto'
  return audio
}

/**
 * 全局唯一的播放层，不依赖 Pinia。
 * createMediaElementSource 对同一个 element 只能调用一次，接入 Web Audio 的元素只切换 src。
 * 解灰等第三方音源不带 CORS 头，改用一个不接入 Web Audio 的普通元素播放（没有频谱）。
 */
class AudioEngine {
  private readonly graphAudio = createAudio(true)
  private readonly plainAudio = createAudio(false)
  private active: HTMLAudioElement = this.graphAudio
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
    this.on('loadedmetadata', () => {
      if (this.pendingStart > 0) this.active.currentTime = this.pendingStart
      this.pendingStart = 0
    })
    this.graphAudio.addEventListener('playing', () => this.scheduleSilenceCheck())
  }

  /** 当前负责播放的元素 */
  get audio() {
    return this.active
  }

  get currentTime() {
    return this.pendingStart || this.active.currentTime
  }

  get duration() {
    const { duration } = this.active
    return Number.isFinite(duration) ? duration : 0
  }

  get paused() {
    return this.active.paused
  }

  get hasSource() {
    return !!this.active.getAttribute('src')
  }

  /** 两个元素都监听，只转发当前元素的事件 */
  on<K extends MediaEvent>(type: K, listener: (event: HTMLMediaElementEventMap[K]) => void) {
    const wrapped = (event: HTMLMediaElementEventMap[K]) => {
      if (event.target === this.active) listener(event)
    }
    this.graphAudio.addEventListener(type, wrapped)
    this.plainAudio.addEventListener(type, wrapped)
    return () => {
      this.graphAudio.removeEventListener(type, wrapped)
      this.plainAudio.removeEventListener(type, wrapped)
    }
  }

  load(url: string, startAt = 0) {
    const next = isCorsSafeUrl(url) ? this.graphAudio : this.plainAudio
    if (next !== this.active) {
      // 先切换再清空旧元素，旧元素产生的事件会被 on() 过滤掉
      const previous = this.active
      this.active = next
      this.clear(previous)
      this.applyVolume()
    }
    this.pendingStart = startAt
    this.active.src = url
  }

  /** 自动播放策略要求在用户手势内创建或恢复 AudioContext */
  async play() {
    this.ensureGraph()
    if (this.context?.state === 'suspended') await this.context.resume()
    await this.active.play()
  }

  pause() {
    this.active.pause()
  }

  stop() {
    this.pendingStart = 0
    this.clear(this.active)
  }

  seek(time: number) {
    if (this.active.readyState < HTMLMediaElement.HAVE_METADATA) {
      this.pendingStart = Math.max(time, 0)
      return
    }
    this.active.currentTime = Math.min(Math.max(time, 0), this.duration || Infinity)
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

  /**
   * 只读取，不创建：AudioContext 必须在用户手势（play）中创建，否则会以挂起状态接管输出。
   * 当前为普通元素（第三方音源）时返回 null，频谱不绘制
   */
  getAnalyser() {
    return this.active === this.graphAudio ? this.analyser : null
  }

  setFftSize(size: number) {
    this.fftSize = size
    if (this.analyser) this.analyser.fftSize = size
  }

  private clear(audio: HTMLAudioElement) {
    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }

  /**
   * 媒体跨域且没有 CORS 授权时 MediaElementSource 输出静音，频谱全为 0。
   * 网易云 CDN 目前都带 CORS 头，这里只记录日志，出现实际案例再实现 Rust 代理（见 06 文档）
   */
  private scheduleSilenceCheck() {
    const audio = this.graphAudio
    const analyser = this.analyser
    const host = this.hostOf(audio.currentSrc)
    if (!analyser || !host || this.checkedHosts.has(host)) return
    const startTime = audio.currentTime
    setTimeout(async () => {
      if (audio.paused || this.hostOf(audio.currentSrc) !== host) return
      if (audio.currentTime <= startTime) return
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
    this.plainAudio.volume = level
    // 接入 Web Audio 后由 gain 控制音量，element 保持满音量，频谱数据不随音量衰减
    if (this.gain) {
      this.gain.gain.value = level
      this.graphAudio.volume = 1
    } else {
      this.graphAudio.volume = level
    }
  }

  private ensureGraph() {
    if (this.context || typeof AudioContext === 'undefined') return
    try {
      const context = new AudioContext()
      const source = context.createMediaElementSource(this.graphAudio)
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
