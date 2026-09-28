<script setup lang="ts">
import { resizeImage } from '@/utils/format'

defineProps<{ cover: string }>()
</script>

<template>
  <!-- blur 作用在静态小图上，不用 backdrop-filter，降低集显机器的 GPU 压力 -->
  <div class="pointer-events-none absolute inset-0 overflow-hidden bg-neutral-900">
    <img
      v-if="cover"
      :src="resizeImage(cover, 120)"
      alt=""
      class="absolute inset-0 size-full scale-125 object-cover opacity-70 blur-3xl saturate-150"
    />
    <div class="absolute inset-0 bg-black/45" />
  </div>
</template>
