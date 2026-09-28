import { showContextMenu } from '@/composables/useContextMenu'
import { usePlaylistActions } from '@/composables/usePlaylistActions'
import { notify } from '@/services/notify'
import { useAppStore } from '@/stores/app'
import { useLikeStore } from '@/stores/like'
import { usePlayerStore } from '@/stores/player'
import { usePlaylistStore } from '@/stores/playlist'
import { useUserStore } from '@/stores/user'
import { PlaylistSpecialType, type Song, type UserPlaylist } from '@/types/music'
import { copyText } from '@/utils/clipboard'

import { buildPlaylistMenu } from './playlist-menu'
import { buildQueueMenu } from './queue-menu'
import { buildSongMenu } from './song-menu'

const errorMessage = (error: unknown) => (error as Error).message

export function useSongMenu() {
  const app = useAppStore()
  const user = useUserStore()
  const like = useLikeStore()
  const player = usePlayerStore()
  const playlist = usePlaylistStore()
  const { openCreate } = usePlaylistActions()

  /**
   * @param songs 所在列表，「播放」会以它替换队列
   * @param playlistId 所在歌单，自己创建的普通歌单才允许移除
   */
  function open(event: MouseEvent, song: Song, songs?: Song[], playlistId?: number) {
    const removable =
      playlistId !== undefined &&
      playlist.isOwned(playlistId) &&
      playlistId !== playlist.likedPlaylist?.id

    const items = buildSongMenu(
      {
        song,
        loggedIn: user.isLoggedIn,
        liked: like.isLiked(song.id),
        playlists: playlist.created,
        removableFrom: removable ? playlistId : null,
      },
      {
        play: () => (songs ? player.playSongs(songs, song.id) : player.playSong(song)),
        playNext: () => {
          player.insertNext([song])
          notify.success('已添加到下一首播放')
        },
        addTo: async (pid) => {
          try {
            const added = await playlist.addSongs(pid, [song])
            notify.success(added ? '已添加到歌单' : '歌曲已在歌单中')
          } catch (error) {
            notify.error(`添加失败：${errorMessage(error)}`)
          }
        },
        createAndAdd: () => openCreate([song]),
        removeFromPlaylist: async (pid) => {
          try {
            await playlist.removeSongs(pid, [song.id])
            notify.success('已从歌单中移除')
          } catch (error) {
            notify.error(`移除失败：${errorMessage(error)}`)
          }
        },
        toggleLike: () => void like.toggle(song.id),
        copyLink: async () => {
          try {
            await copyText(`https://music.163.com/song?id=${song.id}`)
            notify.success('已复制歌曲链接')
          } catch (error) {
            notify.error(`复制失败：${errorMessage(error)}`)
          }
        },
        requireLogin: () => (app.loginModalVisible = true),
      },
    )
    showContextMenu(event, items)
  }

  return { open }
}

export function usePlaylistMenu() {
  const player = usePlayerStore()
  const playlist = usePlaylistStore()
  const { openRename, confirmDelete } = usePlaylistActions()

  function open(event: MouseEvent, target: UserPlaylist) {
    const items = buildPlaylistMenu(
      {
        editable: playlist.isOwned(target.id) && target.specialType !== PlaylistSpecialType.Liked,
      },
      {
        playAll: async () => {
          try {
            player.playSongs((await playlist.fetchDetail(target.id)).songs)
          } catch (error) {
            notify.error(`歌单加载失败：${errorMessage(error)}`)
          }
        },
        rename: () => openRename(target),
        remove: () => confirmDelete(target),
      },
    )
    showContextMenu(event, items)
  }

  return { open }
}

export function useQueueMenu() {
  const player = usePlayerStore()

  function open(event: MouseEvent, song: Song) {
    showContextMenu(
      event,
      buildQueueMenu({
        play: () => player.playSong(song),
        remove: () => player.removeFromQueue(song.id),
      }),
    )
  }

  return { open }
}
