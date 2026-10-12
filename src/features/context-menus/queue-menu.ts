import type { MenuAction } from '@/services/context-menu/types'

export type QueueMenuHandlers = {
  play: () => void
  playNext: () => void
  remove: () => void
}

/** active 为当前歌曲时不提供「下一首播放」 */
export function buildQueueMenu(active: boolean, h: QueueMenuHandlers): MenuAction[] {
  return [
    { type: 'item', id: 'play', label: '播放', action: h.play },
    ...(active
      ? []
      : [{ type: 'item', id: 'play-next', label: '下一首播放', action: h.playNext } as const]),
    { type: 'item', id: 'remove', label: '从播放队列移除', action: h.remove },
  ]
}
