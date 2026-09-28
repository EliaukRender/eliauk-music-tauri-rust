import axios, { type AxiosRequestConfig, isAxiosError } from 'axios'

import { resolveApiEndpoint } from '@/services/tauri/api-endpoint'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types/api'

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

  // WebView 与 API 跨源，浏览器 cookie 不可靠；登录态统一以 cookie 参数传递
  const { cookie } = useUserStore()
  if (cookie) {
    if (config.method?.toUpperCase() === 'POST') {
      config.data = { ...config.data, cookie }
    } else {
      config.params = { ...config.params, cookie }
    }
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse | undefined
    if (typeof body?.code === 'number' && body.code !== 200) {
      throw new ApiError(body.message || body.msg || '接口请求失败', body.code)
    }
    return response
  },
  (error: unknown) => {
    if (error instanceof ApiError) throw error
    if (isAxiosError(error)) {
      const body = error.response?.data as ApiResponse | undefined
      const message =
        body?.message || body?.msg || (error.code === 'ECONNABORTED' ? '请求超时' : '网络异常')
      throw new ApiError(message, body?.code ?? error.response?.status)
    }
    throw error
  },
)

export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await http.request<T>(config)
  return response.data
}

export function get<T>(url: string, params?: Record<string, unknown>) {
  return request<T>({ url, method: 'GET', params })
}

export function post<T>(url: string, data?: Record<string, unknown>) {
  return request<T>({ url, method: 'POST', data })
}
