import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { Banner, PlaylistSummary } from '@/types/music'

/** 推荐歌单（无需登录） */
export async function fetchRecommendPlaylists(limit = 30) {
  const res = await get<ApiResponse<{ result: PlaylistSummary[] }>>('/personalized', { limit })
  return res.result
}

/** 首页轮播，type=0 为 PC 端素材 */
export async function fetchBanners() {
  const res = await get<ApiResponse<{ banners: Banner[] }>>('/banner', { type: 0 })
  return res.banners
}
