import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { LyricSource } from '@/utils/lyric/build'

type LyricField = { lyric?: string } | undefined

type RawLyric = {
  lrc?: LyricField
  tlyric?: LyricField
  romalrc?: LyricField
  yrc?: LyricField
  pureMusic?: boolean
  nolyric?: boolean
}

export type LyricResponse = LyricSource & { pureMusic: boolean }

/** /lyric/new 同时返回 LRC、翻译、罗马音与逐字歌词 */
export async function fetchLyric(id: number): Promise<LyricResponse> {
  const res = await get<ApiResponse<RawLyric>>('/lyric/new', { id })
  return {
    lrc: res.lrc?.lyric,
    tlyric: res.tlyric?.lyric,
    romalrc: res.romalrc?.lyric,
    yrc: res.yrc?.lyric,
    pureMusic: !!res.pureMusic,
  }
}
