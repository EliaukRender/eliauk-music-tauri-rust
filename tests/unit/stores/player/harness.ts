import { vi } from 'vitest'

import type { Song, SongUrl } from '@/types/music'

/**
 * player store 测试共用的引擎与接口替身。
 * 测试文件在 vi.mock 工厂里动态导入本模块，与测试代码拿到的是同一份实例
 */
export const listeners = new Map<string, Set<() => void>>()
export const engine = {
  currentTime: 0,
  duration: 0,
  hasSource: false,
  on: vi.fn((type: string, fn: () => void) => {
    if (!listeners.has(type)) listeners.set(type, new Set())
    listeners.get(type)!.add(fn)
    return () => listeners.get(type)!.delete(fn)
  }),
  load: vi.fn(() => {
    engine.hasSource = true
  }),
  play: vi.fn(async () => {}),
  pause: vi.fn(),
  stop: vi.fn(() => {
    engine.hasSource = false
  }),
  seek: vi.fn((t: number) => {
    engine.currentTime = Math.max(t, 0)
  }),
  setVolume: vi.fn(),
  setMuted: vi.fn(),
}
export const api = {
  fetchSongUrl: vi.fn(async (id: number): Promise<SongUrl> => ({
    id,
    url: `https://cdn/${id}.mp3`,
    trial: null,
  })),
  fetchSongDetail: vi.fn(async (): Promise<Song[]> => []),
  fetchUnblockedUrl: vi.fn(async (): Promise<string | null> => null),
}
export const emit = (type: string) => listeners.get(type)?.forEach((fn) => fn())
export function resetHarness() {
  vi.clearAllMocks()
  engine.currentTime = 0
  engine.hasSource = false
  listeners.clear()
  localStorage.clear()
}

export function song(id: number, partial: Partial<Song> = {}): Song {
  return {
    id,
    name: `song-${id}`,
    artists: [],
    album: { id: 0, name: '', picUrl: '' },
    duration: 200_000,
    fee: 0,
    unavailable: false,
    ...partial,
  }
}

export function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((r) => (resolve = r))
  return { promise, resolve }
}

export const flush = () => new Promise((r) => setTimeout(r, 0))
