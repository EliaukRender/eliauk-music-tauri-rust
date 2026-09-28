<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()
</script>

<template>
  <div class="flex h-full items-center justify-center">
    <n-empty :description="`「${route.meta.title}」迁移中`">
      <template #icon><i-ri-hammer-line /></template>
      <template v-if="route.meta.doc" #extra>
        <span class="text-xs text-muted">方案文档：docs/功能方案/{{ route.meta.doc }}</span>
      </template>
    </n-empty>
  </div>
</template>
