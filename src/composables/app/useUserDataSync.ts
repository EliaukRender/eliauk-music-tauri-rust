import { watch } from 'vue'

import { useLikeStore } from '@/stores/like'
import { usePlaylistStore } from '@/stores/playlist'
import { useUserStore } from '@/stores/user'

/** 登录、登出、切换账号时刷新依赖账号的数据 */
export function useUserDataSync() {
  const user = useUserStore()
  const playlist = usePlaylistStore()
  const like = useLikeStore()

  watch(
    () => (user.isLoggedIn ? user.profile?.userId : null),
    (uid) => {
      if (uid) {
        playlist.fetchMine().catch((error) => console.warn('[user-data] 歌单加载失败', error))
        like.fetch().catch((error) => console.warn('[user-data] 喜欢列表加载失败', error))
      } else {
        playlist.clear()
        like.clear()
      }
    },
    { immediate: true },
  )
}
