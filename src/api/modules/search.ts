import { normalizeSong, type RawPrivilege, type RawSong, toHttps } from '@/api/adapters/song'
import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { ArtistSummary, PlaylistSummary, Song } from '@/types/music'

/** /cloudsearch 的 type */
const SearchType = { Song: 1, Playlist: 1000, Artist: 100 } as const

export type SearchPage<T> = { items: T[]; total: number }

type RawResult = {
  songs?: (RawSong & { privilege?: RawPrivilege })[]
  songCount?: number
  playlists?: { id: number; name: string; coverImgUrl: string; playCount: number }[]
  playlistCount?: number
  artists?: { id: number; name: string; img1v1Url?: string; picUrl?: string; alias?: string[] }[]
  artistCount?: number
}

async function cloudsearch(keywords: string, type: number, offset: number, limit: number) {
  const res = await get<ApiResponse<{ result?: RawResult }>>('/cloudsearch', {
    keywords,
    type,
    offset,
    limit,
  })
  // 没有结果时 result 可能缺失
  return res.result ?? {}
}

export async function searchSongs(keywords: string, offset: number, limit: number) {
  const result = await cloudsearch(keywords, SearchType.Song, offset, limit)
  return {
    items: (result.songs ?? []).map((song) => normalizeSong(song, song.privilege)),
    total: result.songCount ?? 0,
  } satisfies SearchPage<Song>
}

export async function searchPlaylists(keywords: string, offset: number, limit: number) {
  const result = await cloudsearch(keywords, SearchType.Playlist, offset, limit)
  return {
    items: (result.playlists ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      picUrl: toHttps(p.coverImgUrl),
      playCount: p.playCount,
    })),
    total: result.playlistCount ?? 0,
  } satisfies SearchPage<PlaylistSummary>
}

export async function searchArtists(keywords: string, offset: number, limit: number) {
  const result = await cloudsearch(keywords, SearchType.Artist, offset, limit)
  return {
    items: (result.artists ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      avatar: toHttps(a.img1v1Url ?? a.picUrl ?? ''),
      alias: a.alias ?? [],
    })),
    total: result.artistCount ?? 0,
  } satisfies SearchPage<ArtistSummary>
}

export async function fetchHotSearches(): Promise<string[]> {
  const res = await get<ApiResponse<{ data: { searchWord: string }[] }>>('/search/hot/detail')
  return res.data.map((item) => item.searchWord)
}

export async function fetchSuggestions(keywords: string): Promise<string[]> {
  const res = await get<ApiResponse<{ result?: { allMatch?: { keyword: string }[] } }>>(
    '/search/suggest',
    { keywords, type: 'mobile' },
  )
  return (res.result?.allMatch ?? []).map((item) => item.keyword)
}
