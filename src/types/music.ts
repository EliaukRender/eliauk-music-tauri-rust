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

/** 网易云歌单的 specialType */
export const PlaylistSpecialType = {
  Normal: 0,
  /** 我喜欢的音乐 */
  Liked: 5,
} as const

export type PlaylistDetail = {
  id: number
  name: string
  coverImgUrl: string
  description: string | null
  playCount: number
  trackCount: number
  tags: string[]
  specialType: number
  creator: { userId: number; nickname: string; avatarUrl: string }
}

/** /user/playlist 中的歌单项 */
export type UserPlaylist = {
  id: number
  name: string
  coverImgUrl: string
  trackCount: number
  creatorId: number
  /** 10 为隐私歌单 */
  privacy: number
  specialType: number
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

export type Toplist = {
  id: number
  name: string
  coverImgUrl: string
  updateFrequency: string
  playCount: number
  /** 官方榜自带的前几首预览 */
  preview: { name: string; artist: string }[]
  official: boolean
}

export type ArtistSummary = {
  id: number
  name: string
  avatar: string
  alias: string[]
}

export type ArtistDetail = ArtistSummary & {
  cover: string
  briefDesc: string
  albumSize: number
  musicSize: number
}

export type AlbumSummary = {
  id: number
  name: string
  picUrl: string
  /** 毫秒时间戳 */
  publishTime: number
  size: number
}
