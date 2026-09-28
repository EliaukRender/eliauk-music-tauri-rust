import { normalizeSongs, type RawPrivilege, type RawSong, toHttps } from '@/api/adapters/song'
import { get } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { PlaylistDetail, Song } from '@/types/music'

type RawPlaylist = Omit<PlaylistDetail, 'creator'> & {
  creator: PlaylistDetail['creator'] | null
}

export async function fetchPlaylistDetail(id: number): Promise<PlaylistDetail> {
  const res = await get<ApiResponse<{ playlist: RawPlaylist }>>('/playlist/detail', { id })
  const { playlist } = res
  return {
    id: playlist.id,
    name: playlist.name,
    coverImgUrl: toHttps(playlist.coverImgUrl),
    description: playlist.description,
    playCount: playlist.playCount,
    trackCount: playlist.trackCount,
    tags: playlist.tags ?? [],
    creator: playlist.creator ?? { userId: 0, nickname: '', avatarUrl: '' },
  }
}

/** 不传 limit 时接口返回全部歌曲 */
export async function fetchPlaylistTracks(id: number): Promise<Song[]> {
  const res = await get<ApiResponse<{ songs: RawSong[]; privileges: RawPrivilege[] }>>(
    '/playlist/track/all',
    { id },
  )
  return normalizeSongs(res.songs, res.privileges)
}
