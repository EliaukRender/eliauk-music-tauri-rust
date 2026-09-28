import { useIntervalFn } from '@vueuse/core'
import { onScopeDispose, ref } from 'vue'

import { checkQr, createQrImage, fetchQrKey } from '@/api/modules/login'
import { QrCheckCode } from '@/constants/login'

export const QrStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Waiting: 'waiting',
  Confirming: 'confirming',
  Authorizing: 'authorizing',
  Error: 'error',
} as const
export type QrStatus = (typeof QrStatus)[keyof typeof QrStatus]

const POLL_INTERVAL = 2000

/**
 * 二维码生命周期：生成、轮询、过期自动重建。
 * 每次生成二维码都会换代，旧代的异步结果一律丢弃，避免关闭弹窗后仍然登录。
 */
export function useQrLogin(onAuthorized: (cookie: string) => Promise<void>) {
  const qrImage = ref('')
  const status = ref<QrStatus>(QrStatus.Idle)
  const scanner = ref<{ nickname?: string; avatarUrl?: string } | null>(null)
  const errorMessage = ref('')

  let generation = 0
  let key = ''
  let polling = false

  const { pause, resume } = useIntervalFn(() => void poll(), POLL_INTERVAL, { immediate: false })

  async function start() {
    const gen = ++generation
    pause()
    status.value = QrStatus.Loading
    scanner.value = null
    errorMessage.value = ''
    try {
      const newKey = await fetchQrKey()
      const image = await createQrImage(newKey)
      if (gen !== generation) return
      key = newKey
      qrImage.value = image
      status.value = QrStatus.Waiting
      resume()
    } catch (error) {
      if (gen !== generation) return
      fail((error as Error).message)
    }
  }

  function stop() {
    generation++
    pause()
    status.value = QrStatus.Idle
  }

  function fail(message: string) {
    pause()
    status.value = QrStatus.Error
    errorMessage.value = message
  }

  async function poll() {
    if (polling) return
    polling = true
    const gen = generation
    try {
      const result = await checkQr(key)
      if (gen !== generation) return
      switch (result.code) {
        case QrCheckCode.Waiting:
          status.value = QrStatus.Waiting
          break
        case QrCheckCode.Confirming:
          status.value = QrStatus.Confirming
          scanner.value = { nickname: result.nickname, avatarUrl: result.avatarUrl }
          break
        case QrCheckCode.Expired:
          void start()
          break
        case QrCheckCode.Authorized:
          pause()
          status.value = QrStatus.Authorizing
          try {
            await onAuthorized(result.cookie)
            if (gen === generation) stop()
          } catch (error) {
            if (gen === generation) fail((error as Error).message)
          }
          break
        case QrCheckCode.RiskControl:
          fail('网易云要求安全验证，请稍后重试')
          break
      }
    } catch (error) {
      // 单次轮询失败不中断，下一轮继续
      console.warn('[qr-login] 轮询失败', error)
    } finally {
      polling = false
    }
  }

  onScopeDispose(stop)

  return { qrImage, status, scanner, errorMessage, start, stop }
}
