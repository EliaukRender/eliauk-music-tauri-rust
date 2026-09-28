import { normalizeSong, type RawPrivilege, type RawSong, toHttps } from '@/api/adapters/song'
import { get } from '@/api/http'
import type { ArtistFilter } from '@/constants/artist'
import type { ApiResponse } from '@/types/api'
import type { AlbumSummary, ArtistDetail, ArtistSummary, Song } from '@/types/music'

type RawArtist = {
  id: number
  name: string
  picUrl?: string
  img1v1Url?: string
  avatar?: string
  cover?: string
  alias?: string[]
  briefDesc?: string
  albumSize?: number
  musicSize?: number
}

function normalizeArtist(raw: RawArtist): ArtistSummary {
  return {
    id: raw.id,
    name: raw.name,
    // img1v1Url 是方形头像，更适合圆形裁切
    avatar: toHttps(raw.img1v1Url ?? raw.avatar ?? raw.picUrl ?? ''),
    alias: raw.alias ?? [],
  }
}

export async function fetchArtists(filter: ArtistFilter, offset: number, limit: number) {
  const res = await get<ApiResponse<{ artists: RawArtist[]; more: boolean }>>('/artist/list', {
    ...filter,
    limit,
    offset,
  })
  return { artists: res.artists.map(normalizeArtist), more: res.more }
}

export async function fetchArtistDetail(id: number): Promise<ArtistDetail> {
  const res = await get<ApiResponse<{ data: { artist: RawArtist } }>>('/artist/detail', { id })
  const { artist } = res.data
  return {
    ...normalizeArtist(artist),
    cover: toHttps(artist.cover ?? artist.picUrl ?? ''),
    briefDesc: artist.briefDesc ?? '',
    albumSize: artist.albumSize ?? 0,
    musicSize: artist.musicSize ?? 0,
  }
}

export async function fetchArtistTopSongs(id: number): Promise<Song[]> {
  const res = await get<ApiResponse<{ songs: (RawSong & { privilege?: RawPrivilege })[] }>>(
    '/artist/top/song',
    { id },
  )
  return res.songs.map((song) => normalizeSong(song, song.privilege))
}

export async function fetchArtistAlbums(id: number, limit = 30, offset = 0) {
  const res = await get<ApiResponse<{ hotAlbums: AlbumSummary[]; more: boolean }>>(
    '/artist/album',
    { id, limit, offset },
  )
  return {
    albums: res.hotAlbums.map((a) => ({ ...a, picUrl: toHttps(a.picUrl) })),
    more: res.more,
  }
}
