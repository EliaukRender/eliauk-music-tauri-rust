import { PlayMode } from '@/constants/player'

export type PickContext = {
  ids: readonly number[]
  currentId: number | null
  mode: PlayMode
  /** 随机模式下的播放顺序，一轮内不重复 */
  shuffleOrder: readonly number[]
}

export type PickResult = {
  id: number | null
  /** 进入新一轮随机时返回新的顺序，调用方需要回写 */
  shuffleOrder: number[]
}

type Random = () => number

export function shuffle<T>(items: readonly T[], random: Random = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j]!, result[i]!]
  }
  return result
}

/** firstId 固定在首位，其余随机 */
export function createShuffleOrder(
  ids: readonly number[],
  firstId: number | null,
  random: Random = Math.random,
): number[] {
  if (firstId === null || !ids.includes(firstId)) return shuffle(ids, random)
  return [
    firstId,
    ...shuffle(
      ids.filter((id) => id !== firstId),
      random,
    ),
  ]
}

/** 新一轮的首首避开刚播完的歌曲，避免跨轮连续重复 */
function nextShuffleRound(ids: readonly number[], lastId: number | null, random: Random) {
  const order = shuffle(ids, random)
  if (order.length > 1 && order[0] === lastId) {
    ;[order[0], order[order.length - 1]] = [order[order.length - 1]!, order[0]!]
  }
  return order
}

/** 保证顺序与队列内容一致：补上新增的 id，去掉已移除的 id */
function syncOrder(ids: readonly number[], order: readonly number[], random: Random) {
  const idSet = new Set(ids)
  const kept = order.filter((id) => idSet.has(id))
  if (kept.length === ids.length) return kept
  const keptSet = new Set(kept)
  return [
    ...kept,
    ...shuffle(
      ids.filter((id) => !keptSet.has(id)),
      random,
    ),
  ]
}

/**
 * @param manual 用户手动切歌时为 true；单曲循环只在自然结束时重复当前歌曲
 */
export function pickNext(
  ctx: PickContext,
  manual: boolean,
  random: Random = Math.random,
): PickResult {
  const { ids, currentId, mode } = ctx
  const order =
    mode === PlayMode.Shuffle ? syncOrder(ids, ctx.shuffleOrder, random) : [...ctx.shuffleOrder]
  if (ids.length === 0) return { id: null, shuffleOrder: order }

  if (mode === PlayMode.RepeatOne && !manual && currentId !== null && ids.includes(currentId)) {
    return { id: currentId, shuffleOrder: order }
  }

  if (mode === PlayMode.Shuffle) {
    const index = currentId === null ? -1 : order.indexOf(currentId)
    if (index >= 0 && index < order.length - 1)
      return { id: order[index + 1]!, shuffleOrder: order }
    if (index === -1 && order.length > 0) return { id: order[0]!, shuffleOrder: order }
    const nextRound = nextShuffleRound(ids, currentId, random)
    return { id: nextRound[0]!, shuffleOrder: nextRound }
  }

  const index = currentId === null ? -1 : ids.indexOf(currentId)
  return { id: ids[(index + 1) % ids.length]!, shuffleOrder: order }
}

export function pickPrev(ctx: PickContext, random: Random = Math.random): PickResult {
  const { ids, currentId, mode } = ctx
  const order =
    mode === PlayMode.Shuffle ? syncOrder(ids, ctx.shuffleOrder, random) : [...ctx.shuffleOrder]
  if (ids.length === 0) return { id: null, shuffleOrder: order }

  const seq = mode === PlayMode.Shuffle ? order : ids
  const index = currentId === null ? -1 : seq.indexOf(currentId)
  if (index === -1) return { id: seq[0]!, shuffleOrder: order }
  return { id: seq[(index - 1 + seq.length) % seq.length]!, shuffleOrder: order }
}
