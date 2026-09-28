<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@tauri-apps/api/core'
import { useMessage } from 'naive-ui'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'

import { fetchBanners } from '@/api/modules/recommend'
import { type ApiEndpoint, resolveApiEndpoint } from '@/services/tauri/api-endpoint'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import { currentPlatform, isDesktop } from '@/utils/platform'

const message = useMessage()
const { themeMode } = storeToRefs(useAppStore())
const { closeBehavior } = storeToRefs(useSettingsStore())

const appVersion = ref('-')
const endpoint = ref<ApiEndpoint | null>(null)
const endpointError = ref('')
const testing = ref(false)

const closeOptions = [
  { label: '最小化到系统托盘', value: 'minimize' },
  { label: '退出应用', value: 'exit' },
]

const themeOptions = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]

onMounted(async () => {
  if (isTauri()) appVersion.value = await getVersion()
  try {
    endpoint.value = await resolveApiEndpoint()
  } catch (error) {
    endpointError.value = (error as Error).message
  }
})

async function testConnection() {
  testing.value = true
  const start = performance.now()
  try {
    await fetchBanners()
    message.success(`连接正常，耗时 ${Math.round(performance.now() - start)}ms`)
  } catch (error) {
    message.error(`连接失败：${(error as Error).message}`)
  } finally {
    testing.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <h1 class="text-xl font-semibold">设置</h1>

    <n-card title="外观" size="small">
      <n-form-item label="主题" label-placement="left" :show-feedback="false">
        <n-radio-group v-model:value="themeMode">
          <n-radio-button v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </n-radio-button>
        </n-radio-group>
      </n-form-item>
    </n-card>

    <n-card v-if="isDesktop" title="窗口" size="small">
      <n-form-item label="点击关闭按钮时" label-placement="left" :show-feedback="false">
        <n-radio-group v-model:value="closeBehavior">
          <n-radio v-for="opt in closeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </n-radio>
        </n-radio-group>
      </n-form-item>
    </n-card>

    <n-card title="音乐服务" size="small">
      <n-descriptions :column="1" label-placement="left" size="small">
        <n-descriptions-item label="接入形态">
          <n-tag
            v-if="endpoint"
            size="small"
            :type="endpoint.mode === 'embedded' ? 'success' : 'info'"
          >
            {{ endpoint.mode === 'embedded' ? '内嵌服务' : '远程服务' }}
          </n-tag>
          <span v-else class="text-muted">{{ endpointError || '检测中…' }}</span>
        </n-descriptions-item>
        <n-descriptions-item label="服务地址">
          <code class="text-xs">{{ endpoint?.baseUrl ?? '-' }}</code>
        </n-descriptions-item>
      </n-descriptions>
      <template #action>
        <n-button size="small" :loading="testing" :disabled="!endpoint" @click="testConnection">
          测试连接
        </n-button>
      </template>
    </n-card>

    <n-card title="关于" size="small">
      <n-descriptions :column="1" label-placement="left" size="small">
        <n-descriptions-item label="版本">{{ appVersion }}</n-descriptions-item>
        <n-descriptions-item label="平台">{{ currentPlatform }}</n-descriptions-item>
      </n-descriptions>
    </n-card>
  </div>
</template>
