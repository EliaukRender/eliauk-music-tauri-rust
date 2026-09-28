import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export type UserProfile = {
  userId: number
  nickname: string
  avatarUrl: string
}

export const useUserStore = defineStore(
  'user',
  () => {
    /** 网易云登录 cookie，随请求以参数形式传递，见 src/api/http.ts */
    const cookie = ref('')
    const profile = ref<UserProfile | null>(null)
    const isLoggedIn = computed(() => !!cookie.value)

    function logout() {
      cookie.value = ''
      profile.value = null
    }

    return { cookie, profile, isLoggedIn, logout }
  },
  { persist: { pick: ['cookie'] } },
)
