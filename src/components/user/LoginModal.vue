<script setup lang="ts">
import { watch } from 'vue'

import { QrStatus, useQrLogin } from '@/composables/useQrLogin'
import { notify } from '@/services/notify'
import { useUserStore } from '@/stores/user'

const show = defineModel<boolean>('show', { required: true })

const user = useUserStore()

const { qrImage, status, scanner, errorMessage, start, stop } = useQrLogin(async (cookie) => {
  await user.loginWithCookie(cookie)
  show.value = false
  notify.success(`欢迎回来，${user.profile?.nickname ?? ''}`)
})

watch(show, (visible) => (visible ? start() : stop()), { immediate: true })
</script>

<template>
  <n-modal
    v-model:show="show"
    preset="card"
    title="扫码登录"
    :bordered="false"
    :auto-focus="false"
    class="w-[360px]!"
  >
    <div class="flex flex-col items-center gap-4 pb-2">
      <div class="relative size-48 overflow-hidden rounded-xl bg-white p-2 ring-1 ring-line">
        <n-spin v-if="status === QrStatus.Loading" class="size-full" />
        <img
          v-else-if="qrImage"
          :src="qrImage"
          alt="登录二维码"
          draggable="false"
          class="size-full"
        />

        <div
          v-if="status === QrStatus.Confirming || status === QrStatus.Authorizing"
          class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/95 text-sm text-neutral-700"
        >
          <n-avatar v-if="scanner?.avatarUrl" round :size="48" :src="scanner.avatarUrl" />
          <i-ri-smartphone-line v-else class="text-3xl text-primary" />
          <span>{{ status === QrStatus.Authorizing ? '正在登录…' : '请在手机上确认登录' }}</span>
        </div>

        <div
          v-if="status === QrStatus.Error"
          class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/95 px-4 text-center text-sm text-neutral-700"
        >
          <span>{{ errorMessage }}</span>
          <n-button size="small" type="primary" @click="start()">重新获取</n-button>
        </div>
      </div>

      <p class="text-sm text-muted">
        打开<span class="text-fg">网易云音乐 App</span>，扫描二维码登录
      </p>
    </div>
  </n-modal>
</template>
