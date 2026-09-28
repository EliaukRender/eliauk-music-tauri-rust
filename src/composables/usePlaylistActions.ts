import { useDialog } from 'naive-ui'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { RouteName } from '@/constants/route'
import { notify } from '@/services/notify'
import { usePlaylistStore } from '@/stores/playlist'

type EditorState = {
  visible: boolean
  /** 为 null 时是新建 */
  target: { id: number; name: string } | null
}

/** 模块级共享：弹窗只挂载一份（DefaultLayout），任何位置都可以打开 */
export const playlistEditor = reactive<EditorState>({ visible: false, target: null })

export function usePlaylistActions() {
  const dialog = useDialog()
  const route = useRoute()
  const router = useRouter()
  const store = usePlaylistStore()

  function openCreate() {
    playlistEditor.target = null
    playlistEditor.visible = true
  }

  function openRename(playlist: { id: number; name: string }) {
    playlistEditor.target = { id: playlist.id, name: playlist.name }
    playlistEditor.visible = true
  }

  function confirmDelete(playlist: { id: number; name: string }) {
    dialog.warning({
      title: '删除歌单',
      content: `确定删除「${playlist.name}」吗？删除后不可恢复。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        try {
          await store.remove(playlist.id)
          notify.success('已删除歌单')
          if (route.name === RouteName.Playlist && Number(route.params.id) === playlist.id) {
            await router.replace({ name: RouteName.Discover })
          }
        } catch (error) {
          notify.error(`删除失败：${(error as Error).message}`)
          return false
        }
      },
    })
  }

  return { openCreate, openRename, confirmDelete }
}
