type MediaEvent = keyof HTMLMediaElementEventMap

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

  constructor() {
    this.audio = new Audio()
    // 不设置时媒体被视为跨域不透明资源，AnalyserNode 只能拿到全 0 数据
    this.audio.crossOrigin = 'anonymous'
    this.audio.preload = 'auto'
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.pendingStart > 0) this.audio.currentTime = this.pendingStart
      this.pendingStart = 0
    })
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

  getAnalyser() {
    this.ensureGraph()
    return this.analyser
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
