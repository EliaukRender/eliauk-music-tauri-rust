import { defineStore } from 'pinia'
import { ref } from 'vue'

import { fetchLikedIds, likeSong } from '@/api/modules/like'
import { notify } from '@/services/notify'

import { useAppStore } from './app'
import { usePlaylistStore } from './playlist'
import { useUserStore } from './user'

export const useLikeStore = defineStore(
  'like',
  () => {
    const user = useUserStore()

    const ids = ref(new Set<number>())
    /** ids 对应的账号；与当前账号不一致时视为失效，防止显示上一个账号的数据 */
    const loadedFor = ref<number | null>(null)
    const pending = ref(new Set<number>())

    function isLiked(id: number) {
      return loadedFor.value === (user.profile?.userId ?? null) && ids.value.has(id)
    }

    async function fetch() {
      const uid = user.profile?.userId
      if (!uid) return
      if (loadedFor.value !== uid) ids.value = new Set()
      const list = await fetchLikedIds(uid)
      if (uid !== user.profile?.userId) return
      ids.value = new Set(list)
      loadedFor.value = uid
    }

    /** 乐观更新，失败回滚；未登录时唤起登录框 */
    async function toggle(id: number) {
      if (!user.isLoggedIn) {
        useAppStore().loginModalVisible = true
        return
      }
      if (pending.value.has(id)) return
      const like = !ids.value.has(id)
      pending.value.add(id)
      apply(id, like)
      try {
        await likeSong(id, like)
        const playlist = usePlaylistStore()
        const liked = playlist.likedPlaylist
        if (liked) {
          playlist.invalidate(liked.id)
          playlist.adjustTrackCount(liked.id, like ? 1 : -1)
        }
      } catch (error) {
        apply(id, !like)
        notify.error(`${like ? '喜欢' : '取消喜欢'}失败：${(error as Error).message}`)
      } finally {
        pending.value.delete(id)
      }
    }

    function apply(id: number, like: boolean) {
      if (like) ids.value.add(id)
      else ids.value.delete(id)
    }

    function clear() {
      ids.value = new Set()
      loadedFor.value = null
    }

    return { ids, loadedFor, pending, isLiked, fetch, toggle, clear }
  },
  {
    persist: {
      pick: ['ids', 'loadedFor'],
      serializer: {
        serialize: ({ ids, loadedFor }) =>
          JSON.stringify({ ids: [...(ids as Set<number>)], loadedFor }),
        deserialize: (raw) => {
          const { ids, loadedFor } = JSON.parse(raw) as { ids?: number[]; loadedFor?: number }
          return { ids: new Set(ids ?? []), loadedFor: loadedFor ?? null }
        },
      },
    },
  },
)
