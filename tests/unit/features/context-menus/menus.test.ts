import { describe, expect, it, vi } from 'vitest'

import { buildPlaylistMenu } from '@/features/context-menus/playlist-menu'
import { buildQueueMenu } from '@/features/context-menus/queue-menu'
import {
  buildSongMenu,
  type SongMenuContext,
  type SongMenuHandlers,
} from '@/features/context-menus/song-menu'
import type { MenuAction } from '@/services/context-menu/types'
import type { Song } from '@/types/music'

const song: Song = {
  id: 1,
  name: 'a',
  artists: [],
  album: { id: 0, name: '', picUrl: '' },
  duration: 0,
  fee: 0,
  unavailable: false,
}

function handlers(): SongMenuHandlers {
  return {
    play: vi.fn(),
    playNext: vi.fn(),
    addTo: vi.fn(),
    createAndAdd: vi.fn(),
    removeFromPlaylist: vi.fn(),
    toggleLike: vi.fn(),
    copyLink: vi.fn(),
    requireLogin: vi.fn(),
  }
}

function ctx(partial: Partial<SongMenuContext> = {}): SongMenuContext {
  return {
    song,
    playable: true,
    loggedIn: true,
    liked: false,
    playlists: [],
    removableFrom: null,
    ...partial,
  }
}

const ids = (items: MenuAction[]) => items.flatMap((i) => (i.type === 'separator' ? [] : [i.id]))
const find = (items: MenuAction[], id: string) =>
  items.find((i) => i.type !== 'separator' && i.id === id)

describe('context-menus', () => {
  it('歌曲菜单：已登录时「添加到歌单」为子菜单，列出可添加的歌单', () => {
    const h = handlers()
    const items = buildSongMenu(ctx({ playlists: [{ id: 7, name: '通勤' }] }), h)
    const addTo = find(items, 'add-to')
    expect(addTo?.type).toBe('submenu')
    const sub = addTo?.type === 'submenu' ? addTo.items : []
    expect(ids(sub)).toEqual(['create', 'add-to-7'])
    const target = find(sub, 'add-to-7')
    if (target?.type === 'item') target.action()
    expect(h.addTo).toHaveBeenCalledWith(7)
  })

  it('歌曲菜单：未登录时「添加到歌单」引导登录', () => {
    const h = handlers()
    const addTo = find(buildSongMenu(ctx({ loggedIn: false }), h), 'add-to')
    expect(addTo?.type).toBe('item')
    if (addTo?.type === 'item') addTo.action()
    expect(h.requireLogin).toHaveBeenCalled()
  })

  it('歌曲菜单：只有在可编辑歌单中才显示「从歌单中移除」', () => {
    const h = handlers()
    expect(ids(buildSongMenu(ctx(), h))).not.toContain('remove')
    const items = buildSongMenu(ctx({ removableFrom: 9 }), h)
    const remove = find(items, 'remove')
    if (remove?.type === 'item') remove.action()
    expect(h.removeFromPlaylist).toHaveBeenCalledWith(9)
  })

  it('歌曲菜单：喜欢状态决定文案，不可播放时禁用播放', () => {
    const items = buildSongMenu(ctx({ liked: true, playable: false }), handlers())
    expect(find(items, 'like')).toMatchObject({ label: '取消喜欢' })
    expect(find(items, 'play')).toMatchObject({ enabled: false })
    expect(find(items, 'play-next')).toMatchObject({ enabled: false })
  })

  it('歌单菜单：只有可编辑歌单显示重命名和删除', () => {
    const h = { playAll: vi.fn(), rename: vi.fn(), remove: vi.fn() }
    expect(ids(buildPlaylistMenu({ editable: false }, h))).toEqual(['play-all'])
    expect(ids(buildPlaylistMenu({ editable: true }, h))).toEqual(['play-all', 'rename', 'delete'])
  })

  it('队列菜单', () => {
    expect(ids(buildQueueMenu({ play: vi.fn(), remove: vi.fn() }))).toEqual(['play', 'remove'])
  })
})
