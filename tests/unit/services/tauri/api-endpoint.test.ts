import { beforeEach, describe, expect, it, vi } from 'vitest'

const tauri = vi.hoisted(() => ({
  isTauri: vi.fn(() => false),
  invoke: vi.fn(),
  listen: vi.fn(async () => () => {}),
}))

vi.mock('@tauri-apps/api/core', () => ({ isTauri: tauri.isTauri, invoke: tauri.invoke }))
vi.mock('@tauri-apps/api/event', () => ({ listen: tauri.listen }))

// 模块内缓存了解析结果，每个用例重新加载
async function loadModule() {
  vi.resetModules()
  return import('@/services/tauri/api-endpoint')
}

describe('resolveApiEndpoint', () => {
  beforeEach(() => {
    tauri.isTauri.mockReturnValue(false)
    tauri.invoke.mockReset()
  })

  it('浏览器环境使用 VITE_API_BASE_URL', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://remote.test')
    const { resolveApiEndpoint } = await loadModule()
    await expect(resolveApiEndpoint()).resolves.toEqual({
      mode: 'remote',
      baseUrl: 'http://remote.test',
    })
  })

  it('远程模式未配置地址时报错', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '')
    const { resolveApiEndpoint } = await loadModule()
    await expect(resolveApiEndpoint()).rejects.toThrow('VITE_API_BASE_URL')
  })

  it('内嵌模式使用 Rust 下发的地址', async () => {
    tauri.isTauri.mockReturnValue(true)
    tauri.invoke.mockResolvedValue({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5000' })
    const { resolveApiEndpoint } = await loadModule()
    await expect(resolveApiEndpoint()).resolves.toEqual({
      mode: 'embedded',
      baseUrl: 'http://127.0.0.1:5000',
    })
    expect(tauri.invoke).toHaveBeenCalledWith('get_api_endpoint')
  })

  it('Tauri 远程模式回退到环境变量', async () => {
    tauri.isTauri.mockReturnValue(true)
    tauri.invoke.mockResolvedValue({ mode: 'remote', baseUrl: null })
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')
    const { resolveApiEndpoint } = await loadModule()
    await expect(resolveApiEndpoint()).resolves.toEqual({
      mode: 'remote',
      baseUrl: 'https://api.example.com',
    })
  })

  it('成功结果被缓存，只调用一次 Rust', async () => {
    tauri.isTauri.mockReturnValue(true)
    tauri.invoke.mockResolvedValue({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5000' })
    const { resolveApiEndpoint } = await loadModule()
    await resolveApiEndpoint()
    await resolveApiEndpoint()
    expect(tauri.invoke).toHaveBeenCalledTimes(1)
  })

  it('失败后下次调用会重试', async () => {
    tauri.isTauri.mockReturnValue(true)
    tauri.invoke
      .mockRejectedValueOnce(new Error('NCM API 服务启动超时'))
      .mockResolvedValueOnce({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5001' })
    const { resolveApiEndpoint } = await loadModule()
    await expect(resolveApiEndpoint()).rejects.toThrow('启动超时')
    await expect(resolveApiEndpoint()).resolves.toMatchObject({ baseUrl: 'http://127.0.0.1:5001' })
  })

  it('sidecar 重启后按事件刷新地址', async () => {
    tauri.isTauri.mockReturnValue(true)
    tauri.invoke.mockResolvedValue({ mode: 'embedded', baseUrl: 'http://127.0.0.1:5000' })
    const { resolveApiEndpoint } = await loadModule()
    await resolveApiEndpoint()

    const [eventName, handler] = tauri.listen.mock.calls.at(-1) as unknown as [
      string,
      (event: { payload: string }) => void,
    ]
    expect(eventName).toBe('api://endpoint-changed')
    handler({ payload: 'http://127.0.0.1:6000' })

    await expect(resolveApiEndpoint()).resolves.toMatchObject({ baseUrl: 'http://127.0.0.1:6000' })
  })
})
