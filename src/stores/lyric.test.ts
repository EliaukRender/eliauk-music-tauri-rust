import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const { api } = vi.hoisted(() => ({
  api: {
    fetchLyric: vi.fn(async () => ({
      lrc: '[00:01.00]a\n[00:02.00]b',
      pureMusic: false,
    })),
  },
}))
vi.mock('@/api/modules/lyric', () => api)
vi.mock('@/services/player/audio-engine', () => ({
  audioEngine: { on: vi.fn(), setVolume: vi.fn(), setMuted: vi.fn() },
}))
vi.mock('@/api/modules/song', () => ({ fetchSongUrl: vi.fn(), fetchSongDetail: vi.fn() }))

const { LyricStatus, useLyricStore } = await import('./lyric')
const { usePlayerStore } = await import('./player')

const flush = () => new Promise((r) => setTimeout(r, 0))

describe('stores/lyric', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('歌词页收起时切歌不加载，展开后加载当前歌曲', async () => {
    const player = usePlayerStore()
    const lyric = useLyricStore()
    player.currentId = 1
    await flush()
    expect(api.fetchLyric).not.toHaveBeenCalled()

    lyric.visible = true
    await flush()
    expect(api.fetchLyric).toHaveBeenCalledWith(1)
    expect(lyric.status).toBe(LyricStatus.Ready)
    expect(lyric.lines).toHaveLength(2)

    player.currentId = 2
    await flush()
    expect(api.fetchLyric).toHaveBeenLastCalledWith(2)
  })

  it('识别纯音乐', async () => {
    api.fetchLyric.mockResolvedValueOnce({ lrc: '[00:00.00]纯音乐，请欣赏', pureMusic: false })
    const lyric = useLyricStore()
    await lyric.load(1)
    expect(lyric.status).toBe(LyricStatus.Pure)
  })

  it('没有歌词时为 empty', async () => {
    api.fetchLyric.mockResolvedValueOnce({ lrc: '', pureMusic: false })
    const lyric = useLyricStore()
    await lyric.load(1)
    expect(lyric.status).toBe(LyricStatus.Empty)
  })

  it('快速切歌时只保留最后一次结果', async () => {
    let resolveFirst!: (v: { lrc: string; pureMusic: boolean }) => void
    api.fetchLyric.mockReturnValueOnce(new Promise((r) => (resolveFirst = r)))
    const lyric = useLyricStore()
    const first = lyric.load(1)
    await lyric.load(2)
    resolveFirst({ lrc: '[00:01.00]old', pureMusic: false })
    await first
    expect(lyric.songId).toBe(2)
    expect(lyric.lines[0]?.text).toBe('a')
  })

  it('偏移按歌曲保存，归零时删除', async () => {
    const lyric = useLyricStore()
    await lyric.load(1)
    lyric.adjustOffset(0.5)
    lyric.adjustOffset(0.5)
    expect(lyric.offset).toBe(1)
    expect(lyric.offsets).toEqual({ 1: 1 })

    await lyric.load(2)
    expect(lyric.offset).toBe(0)

    await lyric.load(1)
    lyric.resetOffset()
    await nextTick()
    expect(lyric.offsets).toEqual({})
  })
})
