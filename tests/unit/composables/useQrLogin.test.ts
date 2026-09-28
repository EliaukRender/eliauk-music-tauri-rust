import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'

import { QrCheckCode } from '@/constants/login'

const { api } = vi.hoisted(() => ({
  api: {
    fetchQrKey: vi.fn(async () => 'key-1'),
    createQrImage: vi.fn(async (key: string) => `data:image/png;base64,${key}`),
    checkQr: vi.fn(),
  },
}))
vi.mock('@/api/modules/login', () => api)

const { QrStatus, useQrLogin } = await import('@/composables/useQrLogin')

function setup(onAuthorized = vi.fn(async () => {})) {
  const scope = effectScope()
  const qr = scope.run(() => useQrLogin(onAuthorized))!
  return { qr, scope, onAuthorized }
}

describe('composables/useQrLogin', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })
  afterEach(() => vi.useRealTimers())

  it('生成二维码后开始轮询，扫码确认后登录', async () => {
    api.checkQr
      .mockResolvedValueOnce({ code: QrCheckCode.Waiting, cookie: '' })
      .mockResolvedValueOnce({ code: QrCheckCode.Confirming, cookie: '', nickname: 'a' })
      .mockResolvedValueOnce({ code: QrCheckCode.Authorized, cookie: 'MUSIC_U=abc' })
    const { qr, onAuthorized } = setup()
    await qr.start()
    expect(qr.qrImage.value).toContain('key-1')
    expect(qr.status.value).toBe(QrStatus.Waiting)

    await vi.advanceTimersByTimeAsync(2000)
    expect(qr.status.value).toBe(QrStatus.Waiting)
    await vi.advanceTimersByTimeAsync(2000)
    expect(qr.status.value).toBe(QrStatus.Confirming)
    expect(qr.scanner.value?.nickname).toBe('a')
    await vi.advanceTimersByTimeAsync(2000)
    expect(onAuthorized).toHaveBeenCalledWith('MUSIC_U=abc')
    expect(qr.status.value).toBe(QrStatus.Idle)

    await vi.advanceTimersByTimeAsync(6000)
    expect(api.checkQr).toHaveBeenCalledTimes(3)
  })

  it('二维码过期后自动重新生成', async () => {
    api.checkQr.mockResolvedValue({ code: QrCheckCode.Waiting, cookie: '' })
    api.checkQr.mockResolvedValueOnce({ code: QrCheckCode.Expired, cookie: '' })
    const { qr } = setup()
    await qr.start()
    api.fetchQrKey.mockResolvedValueOnce('key-2')
    await vi.advanceTimersByTimeAsync(2000)
    expect(api.fetchQrKey).toHaveBeenCalledTimes(2)
    expect(qr.qrImage.value).toContain('key-2')
    expect(qr.status.value).toBe(QrStatus.Waiting)
  })

  it('停止后迟到的扫码结果不会触发登录', async () => {
    let resolveCheck!: (v: unknown) => void
    api.checkQr.mockReturnValueOnce(new Promise((r) => (resolveCheck = r)))
    const { qr, onAuthorized } = setup()
    await qr.start()
    await vi.advanceTimersByTimeAsync(2000)
    qr.stop()
    resolveCheck({ code: QrCheckCode.Authorized, cookie: 'MUSIC_U=abc' })
    await vi.advanceTimersByTimeAsync(0)
    expect(onAuthorized).not.toHaveBeenCalled()
  })

  it('触发风控时停止轮询并提示', async () => {
    api.checkQr.mockResolvedValueOnce({ code: QrCheckCode.RiskControl, cookie: '' })
    const { qr } = setup()
    await qr.start()
    await vi.advanceTimersByTimeAsync(2000)
    expect(qr.status.value).toBe(QrStatus.Error)
    await vi.advanceTimersByTimeAsync(4000)
    expect(api.checkQr).toHaveBeenCalledTimes(1)
  })

  it('登录回调失败时进入错误状态', async () => {
    api.checkQr.mockResolvedValueOnce({ code: QrCheckCode.Authorized, cookie: 'x' })
    const { qr } = setup(vi.fn(async () => Promise.reject(new Error('登录状态校验失败'))))
    await qr.start()
    await vi.advanceTimersByTimeAsync(2000)
    expect(qr.status.value).toBe(QrStatus.Error)
    expect(qr.errorMessage.value).toBe('登录状态校验失败')
  })

  it('作用域销毁时停止轮询', async () => {
    api.checkQr.mockResolvedValue({ code: QrCheckCode.Waiting, cookie: '' })
    const { qr, scope } = setup()
    await qr.start()
    scope.stop()
    await vi.advanceTimersByTimeAsync(6000)
    expect(api.checkQr).not.toHaveBeenCalled()
  })
})
