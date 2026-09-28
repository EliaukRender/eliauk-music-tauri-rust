export type Artist = {
  id: number
  name: string
}

export type Album = {
  id: number
  name: string
  picUrl: string
}

export type Song = {
  id: number
  name: string
  artists: Artist[]
  album: Album
  /** 毫秒 */
  duration: number
  /** 1 / 8 为 VIP 或付费歌曲，未登录时只能试听 */
  fee: number
  /** 无版权（灰色）歌曲 */
  unavailable: boolean
}

export type PlaylistSummary = {
  id: number
  name: string
  picUrl: string
  playCount: number
  copywriter?: string
}

export type PlaylistDetail = {
  id: number
  name: string
  coverImgUrl: string
  description: string | null
  playCount: number
  trackCount: number
  tags: string[]
  creator: { userId: number; nickname: string; avatarUrl: string }
}

export type Banner = {
  imageUrl: string
  targetId: number
  targetType: number
  typeTitle: string
  url: string | null
}

export type SongUrl = {
  id: number
  url: string | null
  /** 试听片段在原曲中的区间（秒）；此时 url 只包含该片段 */
  trial: { start: number; end: number } | null
}
