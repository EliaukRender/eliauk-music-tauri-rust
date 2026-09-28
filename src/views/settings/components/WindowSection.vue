<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useSettingsStore } from '@/stores/settings'

const { closeBehavior } = storeToRefs(useSettingsStore())

const closeOptions = [
  { label: '最小化到系统托盘', value: 'minimize' },
  { label: '退出应用', value: 'exit' },
]
</script>

<template>
  <n-card title="窗口" size="small">
    <n-form-item label="点击关闭按钮时" label-placement="left" :show-feedback="false">
      <n-radio-group v-model:value="closeBehavior">
        <n-radio v-for="opt in closeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </n-radio>
      </n-radio-group>
    </n-form-item>
  </n-card>
</template>
