import { describe, expect, it } from 'vitest'

import { normalizeSong, normalizeSongs, normalizeSongUrl, toHttps } from './song'

describe('api/adapters/song', () => {
  it('把 http 升级为 https，其他地址保持不变', () => {
    expect(toHttps('http://m7.music.126.net/a.mp3')).toBe('https://m7.music.126.net/a.mp3')
    expect(toHttps('https://p1.music.126.net/a.jpg')).toBe('https://p1.music.126.net/a.jpg')
    expect(toHttps(null)).toBeNull()
  })

  it('归一化 ar/al/dt 字段', () => {
    const song = normalizeSong({
      id: 1,
      name: '海屿你',
      ar: [{ id: 2, name: '马也' }],
      al: { id: 3, name: '专辑', picUrl: 'http://p4.music.126.net/x.jpg' },
      dt: 295940,
      fee: 8,
    })
    expect(song).toEqual({
      id: 1,
      name: '海屿你',
      artists: [{ id: 2, name: '马也' }],
      album: { id: 3, name: '专辑', picUrl: 'https://p4.music.126.net/x.jpg' },
      duration: 295940,
      fee: 8,
      unavailable: false,
    })
  })

  it('归一化 artists/album/duration 字段并补齐缺省值', () => {
    const song = normalizeSong({
      id: 1,
      name: null,
      artists: [{ id: 2, name: null }],
      album: { id: 3, name: '专辑' },
      duration: 1000,
    })
    expect(song.name).toBe('')
    expect(song.artists).toEqual([{ id: 2, name: '' }])
    expect(song.album.picUrl).toBe('')
    expect(song.duration).toBe(1000)
    expect(song.fee).toBe(0)
  })

  it('按 privilege.st 标记无版权歌曲', () => {
    const songs = normalizeSongs(
      [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' },
      ],
      [
        { id: 1, st: 0 },
        { id: 2, st: -200 },
      ],
    )
    expect(songs.map((s) => s.unavailable)).toEqual([false, true, false])
  })

  it('解析试听片段', () => {
    expect(
      normalizeSongUrl({ id: 1, url: 'http://a/b.mp3', freeTrialInfo: { start: 6, end: 44 } }),
    ).toEqual({ id: 1, url: 'https://a/b.mp3', trial: { start: 6, end: 44 } })
    expect(normalizeSongUrl({ id: 1, url: 'https://a', freeTrialInfo: 'null' }).trial).toBeNull()
    expect(normalizeSongUrl({ id: 1, url: null, freeTrialInfo: null })).toEqual({
      id: 1,
      url: null,
      trial: null,
    })
  })
})
