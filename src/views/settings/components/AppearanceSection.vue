<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { useAppStore } from '@/stores/app'

const { themeMode } = storeToRefs(useAppStore())

const themeOptions = [
  { label: '跟随系统', value: 'system' },
  { label: '浅色', value: 'light' },
  { label: '深色', value: 'dark' },
]
</script>

<template>
  <n-card title="外观" size="small">
    <n-form-item label="主题" label-placement="left" :show-feedback="false">
      <n-radio-group v-model:value="themeMode">
        <n-radio-button v-for="opt in themeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </n-radio-button>
      </n-radio-group>
    </n-form-item>
  </n-card>
</template>
