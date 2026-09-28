<script setup lang="ts">
import SpectrumSettings from './SpectrumSettings.vue'
</script>

<template>
  <n-popover trigger="click" placement="top-end" :show-arrow="false">
    <template #trigger>
      <button class="hover:text-fg" title="频谱设置">
        <i-ri-bar-chart-2-line class="text-lg" />
      </button>
    </template>
    <SpectrumSettings />
  </n-popover>
</template>
