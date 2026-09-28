import type { Song, SongUrl } from '@/types/music'

type RawArtist = { id: number; name: string | null }
type RawAlbum = { id: number; name: string | null; picUrl?: string | null }

/** /song/detail、/playlist/track/all 使用 ar/al/dt，/search 等旧接口使用 artists/album/duration */
export type RawSong = {
  id: number
  name: string | null
  ar?: RawArtist[]
  artists?: RawArtist[]
  al?: RawAlbum
  album?: RawAlbum
  dt?: number
  duration?: number
  fee?: number
}

/** 仅列出用到的字段；st < 0 表示无版权 */
export type RawPrivilege = { id: number; st: number }

export type RawSongUrl = {
  id: number
  url: string | null
  /** 解灰结果中为字符串 'null' */
  freeTrialInfo: { start: number; end: number } | string | null
}

/**
 * macOS 页面源 tauri://localhost 是安全上下文，http 媒体属于混合内容，WKWebView 行为不稳定；
 * 网易云 CDN 的 https 地址同样带 CORS 头，统一升级
 */
export function toHttps(url: string): string
export function toHttps(url: string | null | undefined): string | null
export function toHttps(url: string | null | undefined) {
  if (!url) return url ?? null
  return url.replace(/^http:\/\//, 'https://')
}

export function normalizeSong(raw: RawSong, privilege?: RawPrivilege): Song {
  const album = raw.al ?? raw.album
  return {
    id: raw.id,
    name: raw.name ?? '',
    artists: (raw.ar ?? raw.artists ?? []).map((a) => ({ id: a.id, name: a.name ?? '' })),
    album: {
      id: album?.id ?? 0,
      name: album?.name ?? '',
      picUrl: toHttps(album?.picUrl) ?? '',
    },
    duration: raw.dt ?? raw.duration ?? 0,
    fee: raw.fee ?? 0,
    unavailable: privilege ? privilege.st < 0 : false,
  }
}

export function normalizeSongs(songs: RawSong[], privileges: RawPrivilege[] = []): Song[] {
  const privilegeMap = new Map(privileges.map((p) => [p.id, p]))
  return songs.map((song) => normalizeSong(song, privilegeMap.get(song.id)))
}

export function normalizeSongUrl(raw: RawSongUrl): SongUrl {
  const trial = typeof raw.freeTrialInfo === 'object' ? raw.freeTrialInfo : null
  return {
    id: raw.id,
    url: toHttps(raw.url),
    trial: trial ? { start: trial.start, end: trial.end } : null,
  }
}
