import type { MenuAction } from '@/services/context-menu/types'

export type QueueMenuHandlers = {
  play: () => void
  remove: () => void
}

export function buildQueueMenu(h: QueueMenuHandlers): MenuAction[] {
  return [
    { type: 'item', id: 'play', label: '播放', action: h.play },
    { type: 'item', id: 'remove', label: '从播放队列移除', action: h.remove },
  ]
}
