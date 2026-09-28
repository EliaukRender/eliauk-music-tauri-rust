import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { fetchLoginStatus, logout as logoutApi } from '@/api/modules/login'
import { clearCredential, loadCredential, saveCredential } from '@/services/tauri/credential'
import type { UserProfile } from '@/types/user'
import { compactCookie } from '@/utils/cookie'

/** 旧版本把 cookie 明文存在这里，启动时迁移到系统凭据库 */
const LEGACY_STORAGE_KEY = 'eliauk:user'

function takeLegacyCookie(): string | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    const { cookie, ...rest } = JSON.parse(raw) as { cookie?: string }
    if (!cookie) return null
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(rest))
    return cookie
  } catch {
    return null
  }
}

export const useUserStore = defineStore(
  'user',
  () => {
    /**
     * 网易云登录 cookie，随请求以参数形式传递（见 src/api/http.ts）。
     * 不进 localStorage，持久化在系统凭据库，启动时由 hydrateCookie 读取
     */
    const cookie = ref('')
    /** 持久化用于冷启动首屏展示，随后由 refreshLoginStatus 校验 */
    const profile = ref<UserProfile | null>(null)

    const isLoggedIn = computed(() => !!cookie.value && !!profile.value)
    const isVip = computed(() => (profile.value?.vipType ?? 0) > 0)

    /** 应用挂载前调用，保证首批请求已带上登录态；读取失败按未登录处理 */
    async function hydrateCookie() {
      try {
        let value = await loadCredential()
        const legacy = takeLegacyCookie()
        if (!value && legacy) {
          value = compactCookie(legacy)
          await saveCredential(value)
        }
        cookie.value = value ?? ''
      } catch (error) {
        console.warn('[user] 读取登录凭据失败', error)
      }
    }

    /** 先写入 cookie 再校验，校验通过才持久化，失败回滚 */
    async function loginWithCookie(value: string) {
      cookie.value = compactCookie(value)
      try {
        const result = await fetchLoginStatus()
        if (!result) throw new Error('登录状态校验失败')
        profile.value = result
        await saveCredential(cookie.value)
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
      clearCredential().catch((error) => console.warn('[user] 清除登录凭据失败', error))
    }

    return {
      cookie,
      profile,
      isLoggedIn,
      isVip,
      hydrateCookie,
      loginWithCookie,
      refreshLoginStatus,
      logout,
      clear,
    }
  },
  { persist: { pick: ['profile'] } },
)
