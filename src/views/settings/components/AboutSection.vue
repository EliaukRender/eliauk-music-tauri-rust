<script setup lang="ts">
import { getVersion } from '@tauri-apps/api/app'
import { isTauri } from '@tauri-apps/api/core'
import { onMounted, ref } from 'vue'

import { currentPlatform } from '@/utils/platform'

const appVersion = ref('-')

onMounted(async () => {
  if (isTauri()) appVersion.value = await getVersion()
})
</script>

<template>
  <n-card title="关于" size="small">
    <n-descriptions :column="1" label-placement="left" size="small">
      <n-descriptions-item label="版本">{{ appVersion }}</n-descriptions-item>
      <n-descriptions-item label="平台">{{ currentPlatform }}</n-descriptions-item>
    </n-descriptions>
  </n-card>
</template>
