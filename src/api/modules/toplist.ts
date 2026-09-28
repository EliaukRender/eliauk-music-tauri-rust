import { toHttps } from '@/api/adapters/song'
import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { Toplist } from '@/types/music'

type RawToplist = {
  id: number
  name: string
  coverImgUrl: string
  updateFrequency?: string
  playCount?: number
  /** 官方榜为 S/N/O/H 等，其余为 null */
  ToplistType?: string | null
  tracks?: { first: string; second: string }[] | null
}

export async function fetchToplists(): Promise<Toplist[]> {
  const res = await get<ApiResponse<{ list: RawToplist[] }>>('/toplist/detail')
  return res.list.map((item) => ({
    id: item.id,
    name: item.name,
    coverImgUrl: toHttps(item.coverImgUrl),
    updateFrequency: item.updateFrequency ?? '',
    playCount: item.playCount ?? 0,
    preview: (item.tracks ?? []).map((t) => ({ name: t.first, artist: t.second })),
    official: !!item.ToplistType,
  }))
}
