import type { AxiosAdapter, InternalAxiosRequestConfig } from 'axios'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useUserStore } from '@/stores/user'

import { ApiError, get, http, post } from './http'

vi.mock('@/services/tauri/api-endpoint', () => ({
  resolveApiEndpoint: async () => ({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5000' }),
}))

let lastConfig: InternalAxiosRequestConfig | undefined

function respond(data: unknown, status = 200): AxiosAdapter {
  return async (config) => {
    lastConfig = config
    return { data, status, statusText: '', headers: {}, config }
  }
}

describe('api/http', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    lastConfig = undefined
  })

  it('使用解析到的 baseURL', async () => {
    http.defaults.adapter = respond({ code: 200 })
    await get('/banner')
    expect(lastConfig?.baseURL).toBe('http://127.0.0.1:5000')
  })

  it('未登录时不附带 cookie', async () => {
    http.defaults.adapter = respond({ code: 200 })
    await get('/banner', { type: 0 })
    expect(lastConfig?.params).toEqual({ type: 0 })
  })

  it('GET 请求把 cookie 放在 query', async () => {
    useUserStore().cookie = 'MUSIC_U=abc'
    http.defaults.adapter = respond({ code: 200 })
    await get('/user/playlist', { uid: 1 })
    expect(lastConfig?.params).toEqual({ uid: 1, cookie: 'MUSIC_U=abc' })
  })

  it('POST 请求把 cookie 放在 body', async () => {
    useUserStore().cookie = 'MUSIC_U=abc'
    http.defaults.adapter = respond({ code: 200 })
    await post('/playlist/create', { name: 'test' })
    expect(JSON.parse(lastConfig?.data as string)).toEqual({ name: 'test', cookie: 'MUSIC_U=abc' })
  })

  it('业务 code 非 200 时抛出 ApiError', async () => {
    http.defaults.adapter = respond({ code: 301, msg: '需要登录' })
    const error = await get('/likelist').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ code: 301, message: '需要登录' })
  })

  it('HTTP 错误转换为 ApiError 并保留服务端信息', async () => {
    http.defaults.adapter = async (config) => {
      const { AxiosError } = await import('axios')
      throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, null, {
        data: { code: 502, message: '上游异常' },
        status: 502,
        statusText: '',
        headers: {},
        config,
      })
    }
    await expect(get('/banner')).rejects.toMatchObject({ code: 502, message: '上游异常' })
  })

  it('超时给出中文提示', async () => {
    http.defaults.adapter = async (config) => {
      const { AxiosError } = await import('axios')
      throw new AxiosError('timeout', 'ECONNABORTED', config)
    }
    await expect(get('/banner')).rejects.toMatchObject({ message: '请求超时' })
  })
})
