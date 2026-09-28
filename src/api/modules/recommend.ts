import { normalizeSong, type RawPrivilege, type RawSong, toHttps } from '@/api/adapters/song'
import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { Banner, PlaylistSummary, Song } from '@/types/music'

/** 外链广告，按方案过滤 */
const BANNER_TYPE_EXTERNAL = 3000

type RawPlaylistSummary = {
  id: number
  name: string
  picUrl?: string
  coverImgUrl?: string
  playCount?: number
  playcount?: number
  copywriter?: string
}

function normalizePlaylist(raw: RawPlaylistSummary): PlaylistSummary {
  return {
    id: raw.id,
    name: raw.name,
    picUrl: toHttps(raw.picUrl ?? raw.coverImgUrl ?? ''),
    playCount: raw.playCount ?? raw.playcount ?? 0,
    copywriter: raw.copywriter || undefined,
  }
}

/** 推荐歌单（无需登录） */
export async function fetchRecommendPlaylists(limit = 30) {
  const res = await get<ApiResponse<{ result: RawPlaylistSummary[] }>>('/personalized', { limit })
  return res.result.map(normalizePlaylist)
}

/** 每日推荐歌单（需要登录） */
export async function fetchDailyPlaylists() {
  const res = await get<ApiResponse<{ recommend: RawPlaylistSummary[] }>>('/recommend/resource')
  return res.recommend.map(normalizePlaylist)
}

export async function fetchHighQualityPlaylists(limit = 12) {
  const res = await get<ApiResponse<{ playlists: RawPlaylistSummary[] }>>(
    '/top/playlist/highquality',
    { limit },
  )
  return res.playlists.map(normalizePlaylist)
}

type RawNewSong = { song: RawSong & { privilege?: RawPrivilege } }

export async function fetchNewSongs(limit = 10): Promise<Song[]> {
  const res = await get<ApiResponse<{ result: RawNewSong[] }>>('/personalized/newsong', { limit })
  return res.result.map(({ song }) => normalizeSong(song, song.privilege))
}

/** 首页轮播，type=0 为 PC 端素材 */
export async function fetchBanners(): Promise<Banner[]> {
  const res = await get<ApiResponse<{ banners: Banner[] }>>('/banner', { type: 0 })
  return res.banners
    .filter((b) => b.targetType !== BANNER_TYPE_EXTERNAL)
    .map((b) => ({ ...b, imageUrl: toHttps(b.imageUrl) }))
}
