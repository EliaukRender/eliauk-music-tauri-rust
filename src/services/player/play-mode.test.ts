import { describe, expect, it } from 'vitest'

import { PlayMode } from '@/constants/player'

import { createShuffleOrder, type PickContext, pickNext, pickPrev, shuffle } from './play-mode'

/** 可复现的伪随机数 */
function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}

function ctx(partial: Partial<PickContext>): PickContext {
  return { ids: [1, 2, 3], currentId: 1, mode: PlayMode.Sequence, shuffleOrder: [], ...partial }
}

describe('services/player/play-mode', () => {
  it('shuffle 不丢失也不重复元素', () => {
    const result = shuffle([1, 2, 3, 4, 5], seeded())
    expect([...result].sort()).toEqual([1, 2, 3, 4, 5])
  })

  it('createShuffleOrder 把指定歌曲放在首位', () => {
    const order = createShuffleOrder([1, 2, 3, 4], 3, seeded())
    expect(order[0]).toBe(3)
    expect([...order].sort()).toEqual([1, 2, 3, 4])
  })

  it('空队列返回 null', () => {
    for (const mode of Object.values(PlayMode)) {
      expect(pickNext(ctx({ ids: [], currentId: null, mode }), true).id).toBeNull()
      expect(pickPrev(ctx({ ids: [], currentId: null, mode })).id).toBeNull()
    }
  })

  it('顺序模式按列表循环', () => {
    expect(pickNext(ctx({ currentId: 1 }), true).id).toBe(2)
    expect(pickNext(ctx({ currentId: 3 }), false).id).toBe(1)
    expect(pickPrev(ctx({ currentId: 1 })).id).toBe(3)
    expect(pickNext(ctx({ currentId: null }), true).id).toBe(1)
  })

  it('单曲循环：自然结束重复当前，手动切歌按顺序', () => {
    const c = ctx({ currentId: 2, mode: PlayMode.RepeatOne })
    expect(pickNext(c, false).id).toBe(2)
    expect(pickNext(c, true).id).toBe(3)
    expect(pickPrev(c).id).toBe(1)
  })

  it('随机模式只有 1 首时不报错', () => {
    const c = ctx({ ids: [7], currentId: 7, mode: PlayMode.Shuffle, shuffleOrder: [7] })
    expect(pickNext(c, true).id).toBe(7)
    expect(pickPrev(c).id).toBe(7)
  })

  it('随机模式连续 N 次下一首不重复', () => {
    const ids = [1, 2, 3, 4, 5, 6, 7, 8]
    const random = seeded(42)
    let order = createShuffleOrder(ids, 1, random)
    let currentId: number | null = 1
    const played = [currentId]
    for (let i = 0; i < ids.length - 1; i++) {
      const result = pickNext(
        { ids, currentId, mode: PlayMode.Shuffle, shuffleOrder: order },
        true,
        random,
      )
      order = result.shuffleOrder
      currentId = result.id
      played.push(currentId!)
    }
    expect(new Set(played).size).toBe(ids.length)
  })

  it('随机模式一轮结束后重新洗牌，且不会紧接着重复上一首', () => {
    const ids = [1, 2, 3]
    for (let seed = 1; seed < 50; seed++) {
      const result = pickNext(
        { ids, currentId: 3, mode: PlayMode.Shuffle, shuffleOrder: [1, 2, 3] },
        true,
        seeded(seed),
      )
      expect(result.id).not.toBe(3)
      expect([...result.shuffleOrder].sort()).toEqual(ids)
    }
  })

  it('随机顺序与队列不一致时自动同步', () => {
    const result = pickNext(
      { ids: [1, 2, 4], currentId: 1, mode: PlayMode.Shuffle, shuffleOrder: [1, 3, 2] },
      true,
      seeded(),
    )
    expect(result.id).toBe(2)
    expect(result.shuffleOrder).toEqual([1, 2, 4])
  })

  it('随机模式上一首沿随机顺序回退', () => {
    const c = ctx({ currentId: 2, mode: PlayMode.Shuffle, shuffleOrder: [3, 2, 1] })
    expect(pickPrev(c).id).toBe(3)
  })
})
