<script setup lang="ts">
withDefaults(defineProps<{ size?: number; showName?: boolean }>(), {
  size: 28,
  showName: true,
})
</script>

<template>
  <div class="flex items-center gap-2">
    <img src="/logo.svg" :width="size" :height="size" alt="Eliauk" draggable="false" />
    <span v-if="showName" class="text-[15px] font-semibold tracking-wide">Eliauk 音乐</span>
  </div>
</template>
