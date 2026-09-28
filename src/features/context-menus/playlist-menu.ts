import { type MenuAction, separator } from '@/services/context-menu/types'

export type PlaylistMenuContext = {
  /** 自己创建且不是「我喜欢的音乐」 */
  editable: boolean
}

export type PlaylistMenuHandlers = {
  playAll: () => void
  rename: () => void
  remove: () => void
}

export function buildPlaylistMenu(ctx: PlaylistMenuContext, h: PlaylistMenuHandlers): MenuAction[] {
  const items: MenuAction[] = [
    { type: 'item', id: 'play-all', label: '播放全部', action: h.playAll },
  ]
  if (ctx.editable) {
    items.push(
      separator,
      { type: 'item', id: 'rename', label: '重命名…', action: h.rename },
      { type: 'item', id: 'delete', label: '删除歌单…', action: h.remove },
    )
  }
  return items
}
