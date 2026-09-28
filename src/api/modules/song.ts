import {
  normalizeSongs,
  normalizeSongUrl,
  type RawPrivilege,
  type RawSong,
  type RawSongUrl,
  toHttps,
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

/** 解灰匹配可能要逐个尝试音源，比普通请求慢 */
const UNBLOCK_TIMEOUT = 30_000

/**
 * 从第三方音源匹配无版权歌曲，匹配失败返回 null。
 * 返回的地址通常不带 CORS 头，由 audio-engine 用普通元素播放
 */
export async function fetchUnblockedUrl(id: number): Promise<string | null> {
  try {
    const res = await get<ApiResponse<{ data: string | null }>>(
      '/song/url/match',
      { id },
      { timeout: UNBLOCK_TIMEOUT },
    )
    return typeof res.data === 'string' && res.data ? toHttps(res.data) : null
  } catch {
    return null
  }
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
