import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'

import { HISTORY_LIMIT, useHistoryStore } from '@/stores/history'
import type { Song } from '@/types/music'

const song = (id: number) => ({ id, name: `song-${id}` }) as Song

describe('stores/history', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('最近播放在前，重复播放移到最前并更新时间', () => {
    const history = useHistoryStore()
    history.record(song(1), 100)
    history.record(song(2), 200)
    history.record(song(1), 300)
    expect(history.entries.map((e) => [e.song.id, e.playedAt])).toEqual([
      [1, 300],
      [2, 200],
    ])
  })

  it('超出上限时丢弃最早的记录', () => {
    const history = useHistoryStore()
    for (let i = 0; i <= HISTORY_LIMIT; i++) history.record(song(i), i)
    expect(history.entries).toHaveLength(HISTORY_LIMIT)
    expect(history.entries.at(-1)!.song.id).toBe(1)
  })

  it('删除单条与清空', () => {
    const history = useHistoryStore()
    history.record(song(1))
    history.record(song(2))
    history.remove(1)
    expect(history.entries.map((e) => e.song.id)).toEqual([2])
    history.clear()
    expect(history.entries).toEqual([])
  })
})
