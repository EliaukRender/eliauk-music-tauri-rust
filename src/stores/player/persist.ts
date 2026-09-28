import type { PersistenceOptions } from 'pinia-plugin-persistedstate'

import type { Song } from '@/types/music'

/** 队列只持久化 id，冷启动由 restore() 补全 */
export const playerPersist: PersistenceOptions = {
  pick: [
    'queue',
    'pendingQueueIds',
    'currentId',
    'volume',
    'muted',
    'mode',
    'level',
    'lastPosition',
  ],
  serializer: {
    serialize: ({ queue, pendingQueueIds, ...rest }) => {
      const ids = (queue as Song[]).map((s) => s.id)
      // restore 完成前队列为空，沿用待恢复的 id，避免被空队列覆盖
      return JSON.stringify({ ...rest, queueIds: ids.length ? ids : pendingQueueIds })
    },
    deserialize: (raw) => {
      const { queueIds, ...rest } = JSON.parse(raw) as { queueIds?: number[] }
      return { ...rest, pendingQueueIds: queueIds ?? [] }
    },
  },
}
