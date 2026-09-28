import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { fetchLoginStatus, logout as logoutApi } from '@/api/modules/login'
import type { UserProfile } from '@/types/user'

export const useUserStore = defineStore(
  'user',
  () => {
    /** 网易云登录 cookie，随请求以参数形式传递，见 src/api/http.ts */
    const cookie = ref('')
    /** 持久化用于冷启动首屏展示，随后由 refreshLoginStatus 校验 */
    const profile = ref<UserProfile | null>(null)

    const isLoggedIn = computed(() => !!cookie.value && !!profile.value)
    const isVip = computed(() => (profile.value?.vipType ?? 0) > 0)

    /** 先写入 cookie 再校验，校验失败回滚 */
    async function loginWithCookie(value: string) {
      cookie.value = value
      try {
        const result = await fetchLoginStatus()
        if (!result) throw new Error('登录状态校验失败')
        profile.value = result
      } catch (error) {
        clear()
        throw error
      }
    }

    /** 网络异常时保留本地登录态，只有服务端明确返回未登录才清空 */
    async function refreshLoginStatus() {
      if (!cookie.value) return
      try {
        const result = await fetchLoginStatus()
        if (result) profile.value = result
        else clear()
      } catch (error) {
        console.warn('[user] 登录状态校验失败', error)
      }
    }

    async function logout() {
      try {
        await logoutApi()
      } catch {
        // 服务端退出失败不影响本地清理
      }
      clear()
    }

    function clear() {
      cookie.value = ''
      profile.value = null
    }

    return {
      cookie,
      profile,
      isLoggedIn,
      isVip,
      loginWithCookie,
      refreshLoginStatus,
      logout,
      clear,
    }
  },
  { persist: { pick: ['cookie', 'profile'] } },
)
