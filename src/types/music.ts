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
}

export type PlaylistSummary = {
  id: number
  name: string
  picUrl: string
  playCount: number
  copywriter?: string
}

export type Banner = {
  imageUrl: string
  targetId: number
  targetType: number
  typeTitle: string
  url: string | null
}
