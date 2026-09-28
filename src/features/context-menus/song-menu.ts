import { type MenuAction, separator } from '@/services/context-menu/types'
import type { Song } from '@/types/music'

export type SongMenuContext = {
  song: Song
  loggedIn: boolean
  liked: boolean
  /** 可添加的歌单（自己创建、不含「我喜欢的音乐」） */
  playlists: { id: number; name: string }[]
  /** 当前所在的、可以移除歌曲的歌单 */
  removableFrom: number | null
}

export type SongMenuHandlers = {
  play: () => void
  playNext: () => void
  addTo: (playlistId: number) => void
  createAndAdd: () => void
  removeFromPlaylist: (playlistId: number) => void
  toggleLike: () => void
  copyLink: () => void
  requireLogin: () => void
}

export function buildSongMenu(ctx: SongMenuContext, h: SongMenuHandlers): MenuAction[] {
  const playable = !ctx.song.unavailable
  const items: MenuAction[] = [
    { type: 'item', id: 'play', label: '播放', enabled: playable, action: h.play },
    { type: 'item', id: 'play-next', label: '下一首播放', enabled: playable, action: h.playNext },
    separator,
  ]

  if (ctx.loggedIn) {
    items.push({
      type: 'submenu',
      id: 'add-to',
      label: '添加到歌单',
      items: [
        { type: 'item', id: 'create', label: '新建歌单…', action: h.createAndAdd },
        ...(ctx.playlists.length ? [separator] : []),
        ...ctx.playlists.map<MenuAction>((p) => ({
          type: 'item',
          id: `add-to-${p.id}`,
          label: p.name,
          action: () => h.addTo(p.id),
        })),
      ],
    })
  } else {
    items.push({ type: 'item', id: 'add-to', label: '添加到歌单…', action: h.requireLogin })
  }

  items.push({
    type: 'item',
    id: 'like',
    label: ctx.liked ? '取消喜欢' : '喜欢',
    action: h.toggleLike,
  })

  if (ctx.removableFrom !== null) {
    const pid = ctx.removableFrom
    items.push({
      type: 'item',
      id: 'remove',
      label: '从歌单中移除',
      action: () => h.removeFromPlaylist(pid),
    })
  }

  items.push(separator, {
    type: 'item',
    id: 'copy-link',
    label: '复制歌曲链接',
    action: h.copyLink,
  })
  return items
}
