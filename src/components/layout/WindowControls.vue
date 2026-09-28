<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  closeWindow,
  minimizeWindow,
  onMaximizedChange,
  toggleMaximizeWindow,
} from '@/services/tauri/window'

const isMaximized = ref(false)
let unlisten: (() => void) | undefined

onMounted(async () => {
  unlisten = await onMaximizedChange((value) => (isMaximized.value = value))
})
onBeforeUnmount(() => unlisten?.())
</script>

<template>
  <!-- 尺寸对齐 Windows 11 标题栏按钮规范（46×32） -->
  <div class="flex self-start">
    <button class="control-btn" title="最小化" @click="minimizeWindow">
      <i-ri-subtract-line />
    </button>
    <button
      class="control-btn"
      :title="isMaximized ? '向下还原' : '最大化'"
      @click="toggleMaximizeWindow"
    >
      <i-ri-checkbox-multiple-blank-line v-if="isMaximized" class="text-[13px]" />
      <i-ri-checkbox-blank-line v-else class="text-[13px]" />
    </button>
    <button
      class="control-btn hover:bg-[#c42b1c]! hover:text-white!"
      title="关闭"
      @click="closeWindow"
    >
      <i-ri-close-line />
    </button>
  </div>
</template>

<style scoped>
@reference '@/assets/styles/main.css';

.control-btn {
  @apply flex h-8 w-[46px] items-center justify-center text-base text-fg transition-colors hover:bg-black/5 dark:hover:bg-white/10;
}
</style>
