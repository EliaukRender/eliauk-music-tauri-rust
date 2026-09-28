import { describe, expect, it, vi } from 'vitest'

import { audioEngine, isCorsSafeUrl } from '@/services/player/audio-engine'

describe('services/player/audio-engine', () => {
  it('只有网易云音频 CDN 视为带 CORS', () => {
    expect(isCorsSafeUrl('https://m701.music.126.net/a.mp3')).toBe(true)
    expect(isCorsSafeUrl('https://music.163.com/song/media/outer/url?id=1.mp3')).toBe(false)
    expect(isCorsSafeUrl('https://other.kuwo.cn/a.mp3')).toBe(false)
    expect(isCorsSafeUrl('https://evil-music.126.net.example.com/a.mp3')).toBe(false)
    expect(isCorsSafeUrl('not a url')).toBe(false)
  })

  it('第三方音源切到普通元素，只转发当前元素的事件', () => {
    const listener = vi.fn()
    const off = audioEngine.on('ratechange', listener)

    audioEngine.load('https://m7.music.126.net/a.mp3')
    const graph = audioEngine.audio
    expect(graph.crossOrigin).toBe('anonymous')

    audioEngine.load('https://third.party/b.mp3')
    const plain = audioEngine.audio
    expect(plain).not.toBe(graph)
    expect(plain.crossOrigin).toBeNull()
    expect(graph.getAttribute('src')).toBeNull()

    graph.dispatchEvent(new Event('ratechange'))
    expect(listener).not.toHaveBeenCalled()
    plain.dispatchEvent(new Event('ratechange'))
    expect(listener).toHaveBeenCalledTimes(1)

    off()
    plain.dispatchEvent(new Event('ratechange'))
    expect(listener).toHaveBeenCalledTimes(1)
    audioEngine.stop()
  })

  it('音量同时作用于两个元素', () => {
    audioEngine.setVolume(0.3)
    audioEngine.load('https://third.party/b.mp3')
    expect(audioEngine.audio.volume).toBeCloseTo(0.3)
    audioEngine.setMuted(true)
    expect(audioEngine.audio.volume).toBe(0)
    audioEngine.setMuted(false)
    audioEngine.stop()
  })
})
