import { toHttps } from '@/api/adapters/song'
import { get } from '@/api/http'
import { QrCheckCode } from '@/constants/login'
import type { ApiResponse } from '@/types/api'
import type { UserProfile } from '@/types/user'

type RawProfile = { userId: number; nickname: string; avatarUrl: string; vipType?: number }

export type QrCheckResult = {
  code: number
  message: string
  /** 仅 803 时有效 */
  cookie: string
  /** 802 时返回扫码者信息 */
  nickname?: string
  avatarUrl?: string
}

function normalizeProfile(raw: RawProfile): UserProfile {
  return {
    userId: raw.userId,
    nickname: raw.nickname,
    avatarUrl: toHttps(raw.avatarUrl),
    vipType: raw.vipType ?? 0,
  }
}

export async function fetchQrKey() {
  const res = await get<ApiResponse<{ data: { unikey: string } }>>('/login/qr/key')
  return res.data.unikey
}

/** 返回 base64 图片，可直接作为 img src */
export async function createQrImage(key: string) {
  const res = await get<ApiResponse<{ data: { qrimg: string } }>>('/login/qr/create', {
    key,
    qrimg: true,
  })
  return res.data.qrimg
}

export async function checkQr(key: string): Promise<QrCheckResult> {
  // noCookie：避免已有 cookie 干扰轮询结果
  const res = await get<ApiResponse<Omit<QrCheckResult, 'code' | 'message'>>>(
    '/login/qr/check',
    { key, noCookie: true },
    { acceptCodes: Object.values(QrCheckCode) },
  )
  return {
    code: res.code,
    message: res.message ?? '',
    cookie: res.cookie ?? '',
    nickname: res.nickname,
    avatarUrl: res.avatarUrl && toHttps(res.avatarUrl),
  }
}

/** 登录态失效或匿名时返回 null */
export async function fetchLoginStatus(): Promise<UserProfile | null> {
  const res = await get<ApiResponse<{ data: { profile: RawProfile | null } }>>('/login/status')
  return res.data.profile ? normalizeProfile(res.data.profile) : null
}

export async function logout() {
  await get('/logout')
}
