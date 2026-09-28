import { normalizeSongs, type RawPrivilege, type RawSong, toHttps } from '@/api/adapters/song'
import { get, post } from '@/api/http'
import type { ApiResponse } from '@/types/api'
import type { PlaylistDetail, Song, UserPlaylist } from '@/types/music'

/** /playlist/track/all 不传 limit 时服务端默认只取前 1000 首 */
const TRACK_PAGE_SIZE = 1000

type RawPlaylist = Omit<PlaylistDetail, 'creator' | 'specialType'> & {
  specialType?: number
  privacy?: number
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
    specialType: playlist.specialType ?? 0,
    creator: playlist.creator
      ? { ...playlist.creator, avatarUrl: toHttps(playlist.creator.avatarUrl) }
      : { userId: 0, nickname: '', avatarUrl: '' },
  }
}

/** 逐页拉取直到不足一页，保证超过 1000 首的歌单也能拿到全部歌曲 */
export async function fetchPlaylistTracks(id: number): Promise<Song[]> {
  const songs: Song[] = []
  for (let offset = 0; ; offset += TRACK_PAGE_SIZE) {
    const res = await get<ApiResponse<{ songs: RawSong[]; privileges: RawPrivilege[] }>>(
      '/playlist/track/all',
      { id, limit: TRACK_PAGE_SIZE, offset },
    )
    songs.push(...normalizeSongs(res.songs, res.privileges))
    if (res.songs.length < TRACK_PAGE_SIZE) return songs
  }
}

type RawUserPlaylist = Omit<UserPlaylist, 'creatorId'> & { creator: { userId: number } }

export async function fetchUserPlaylists(uid: number): Promise<UserPlaylist[]> {
  const res = await get<ApiResponse<{ playlist: RawUserPlaylist[] }>>('/user/playlist', {
    uid,
    limit: 1000,
  })
  return res.playlist.map((p) => ({
    id: p.id,
    name: p.name,
    coverImgUrl: toHttps(p.coverImgUrl),
    trackCount: p.trackCount,
    creatorId: p.creator.userId,
    privacy: p.privacy ?? 0,
    specialType: p.specialType ?? 0,
  }))
}

export async function createPlaylist(name: string, privacy: boolean) {
  const res = await post<ApiResponse<{ id: number }>>('/playlist/create', {
    name,
    privacy: privacy ? 10 : 0,
  })
  return res.id
}

export async function deletePlaylist(id: number) {
  await get('/playlist/delete', { id })
}

export async function renamePlaylist(id: number, name: string) {
  await post('/playlist/name/update', { id, name })
}

/** 502 表示歌曲已在歌单中，按成功处理 */
export const TRACK_EXISTS_CODE = 502

export async function updatePlaylistTracks(op: 'add' | 'del', pid: number, ids: number[]) {
  await get(
    '/playlist/tracks',
    { op, pid, tracks: ids.join(',') },
    {
      acceptCodes: [200, TRACK_EXISTS_CODE],
    },
  )
}
