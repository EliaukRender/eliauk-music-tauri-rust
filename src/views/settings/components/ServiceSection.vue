<script setup lang="ts">
import { useMessage } from 'naive-ui'
import { onMounted, ref } from 'vue'

import { fetchBanners } from '@/api/modules/recommend'
import { type ApiEndpoint, resolveApiEndpoint } from '@/services/tauri/api-endpoint'

const message = useMessage()

const endpoint = ref<ApiEndpoint | null>(null)
const endpointError = ref('')
const testing = ref(false)

onMounted(async () => {
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
</template>
