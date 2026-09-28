import {
  normalizeSongs,
  normalizeSongUrl,
  type RawPrivilege,
  type RawSong,
  type RawSongUrl,
} from '@/api/adapters/song'
import { get } from '@/api/http'
import type { SoundLevel } from '@/constants/player'
import type { ApiResponse } from '@/types/api'
import type { Song, SongUrl } from '@/types/music'

/** /song/detail 单次请求的 id 上限 */
const DETAIL_BATCH_SIZE = 500

export async function fetchSongUrl(id: number, level: SoundLevel): Promise<SongUrl> {
  const res = await get<ApiResponse<{ data: RawSongUrl[] }>>('/song/url/v1', { id, level })
  const raw = res.data[0]
  return raw ? normalizeSongUrl(raw) : { id, url: null, trial: null }
}

/** 结果顺序与 ids 一致，接口未返回的 id 会被忽略 */
export async function fetchSongDetail(ids: number[]): Promise<Song[]> {
  const batches: number[][] = []
  for (let i = 0; i < ids.length; i += DETAIL_BATCH_SIZE) {
    batches.push(ids.slice(i, i + DETAIL_BATCH_SIZE))
  }
  const results = await Promise.all(
    batches.map((batch) =>
      get<ApiResponse<{ songs: RawSong[]; privileges: RawPrivilege[] }>>('/song/detail', {
        ids: batch.join(','),
      }),
    ),
  )
  const songMap = new Map(
    results.flatMap((res) => normalizeSongs(res.songs, res.privileges)).map((s) => [s.id, s]),
  )
  return ids.flatMap((id) => songMap.get(id) ?? [])
}
