import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { UserProfile } from '@/types/user'

const { api } = vi.hoisted(() => ({
  api: {
    fetchLoginStatus: vi.fn<() => Promise<UserProfile | null>>(),
    logout: vi.fn(async () => {}),
  },
}))
vi.mock('@/api/modules/login', () => api)

const { useUserStore } = await import('./user')

const profile: UserProfile = { userId: 1, nickname: 'Eliauk', avatarUrl: '', vipType: 11 }

describe('stores/user', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loginWithCookie 校验通过后写入资料', async () => {
    api.fetchLoginStatus.mockResolvedValueOnce(profile)
    const user = useUserStore()
    await user.loginWithCookie('MUSIC_U=abc')
    expect(user.cookie).toBe('MUSIC_U=abc')
    expect(user.isLoggedIn).toBe(true)
    expect(user.isVip).toBe(true)
  })

  it('loginWithCookie 校验失败时回滚', async () => {
    api.fetchLoginStatus.mockResolvedValueOnce(null)
    const user = useUserStore()
    await expect(user.loginWithCookie('MUSIC_U=abc')).rejects.toThrow()
    expect(user.cookie).toBe('')
    expect(user.isLoggedIn).toBe(false)
  })

  it('冷启动校验：服务端返回未登录时清空', async () => {
    api.fetchLoginStatus.mockResolvedValueOnce(null)
    const user = useUserStore()
    user.cookie = 'MUSIC_U=abc'
    user.profile = profile
    await user.refreshLoginStatus()
    expect(user.isLoggedIn).toBe(false)
  })

  it('冷启动校验：网络异常时保留登录态', async () => {
    api.fetchLoginStatus.mockRejectedValueOnce(new Error('网络异常'))
    const user = useUserStore()
    user.cookie = 'MUSIC_U=abc'
    user.profile = profile
    await user.refreshLoginStatus()
    expect(user.isLoggedIn).toBe(true)
  })

  it('未登录时不发起校验', async () => {
    await useUserStore().refreshLoginStatus()
    expect(api.fetchLoginStatus).not.toHaveBeenCalled()
  })

  it('退出接口失败也会清空本地登录态', async () => {
    api.logout.mockRejectedValueOnce(new Error('fail'))
    const user = useUserStore()
    user.cookie = 'MUSIC_U=abc'
    user.profile = profile
    await user.logout()
    expect(user.isLoggedIn).toBe(false)
  })
})
