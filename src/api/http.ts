import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'

import { NEED_LOGIN_CODE } from '@/constants/login'
import { notify } from '@/services/notify'
import { resolveApiEndpoint } from '@/services/tauri/api-endpoint'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types/api'

declare module 'axios' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- 模块扩充只能用 interface
  interface AxiosRequestConfig {
    /** 视为成功的业务 code，默认只有 200；如 /login/qr/check 的 800-803 */
    acceptCodes?: readonly number[]
  }
}

export class ApiError extends Error {
  readonly code?: number

  constructor(message: string, code?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

export const http = axios.create({ timeout: 15_000 })

http.interceptors.request.use(async (config) => {
  config.baseURL = (await resolveApiEndpoint()).baseUrl

  // API 服务端会缓存 GET 响应约 2 分钟，登录轮询、收藏等操作后需要拿到最新数据
  const timestamp = Date.now()
  // WebView 与 API 跨源，浏览器 cookie 不可靠；登录态统一以 cookie 参数传递
  const { cookie } = useUserStore()
  const extra = cookie ? { timestamp, cookie } : { timestamp }
  if (config.method?.toUpperCase() === 'POST') {
    config.data = { ...config.data, ...extra }
  } else {
    config.params = { ...config.params, ...extra }
  }
  return config
})

let authExpiredNotified = false

/** 登录态失效：清空本地登录信息，并发请求只提示一次 */
function handleAuthExpired() {
  const user = useUserStore()
  if (!user.cookie) return
  user.clear()
  if (authExpiredNotified) return
  authExpiredNotified = true
  notify.warning('登录已失效，请重新登录')
  setTimeout(() => (authExpiredNotified = false), 3000)
}

function toApiError(body: ApiResponse | undefined, fallback: string, code?: number) {
  const error = new ApiError(body?.message || body?.msg || fallback, body?.code ?? code)
  if (error.code === NEED_LOGIN_CODE) handleAuthExpired()
  return error
}

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse | undefined
    const accepted = response.config.acceptCodes ?? [200]
    if (typeof body?.code === 'number' && !accepted.includes(body.code)) {
      throw toApiError(body, '接口请求失败')
    }
    return response
  },
  (error: unknown) => {
    if (error instanceof ApiError) throw error
    if (isAxiosError(error)) {
      const body = error.response?.data as ApiResponse | undefined
      throw toApiError(
        body,
        error.code === 'ECONNABORTED' ? '请求超时' : '网络异常',
        error.response?.status,
      )
    }
    throw error
  },
)

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config)
  return response.data
}

export function get<T>(
  url: string,
  params?: Record<string, unknown>,
  config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'params'>,
) {
  return request<T>({ ...config, url, method: 'GET', params })
}

export function post<T>(
  url: string,
  data?: Record<string, unknown>,
  config?: Omit<AxiosRequestConfig, 'url' | 'method' | 'data'>,
) {
  return request<T>({ ...config, url, method: 'POST', data })
}
