<script setup lang="ts">
import { resizeImage } from '@/utils/format'

defineProps<{ cover: string; playing: boolean }>()
</script>

<template>
  <div
    class="disc relative flex aspect-square w-full items-center justify-center rounded-full shadow-2xl"
    :style="{ animationPlayState: playing ? 'running' : 'paused' }"
  >
    <img
      v-if="cover"
      :src="resizeImage(cover, 400)"
      alt=""
      draggable="false"
      class="size-[64%] rounded-full object-cover"
    />
  </div>
</template>

<style scoped>
.disc {
  /* 黑胶纹理：细密的同心圆 + 高光 */
  background:
    radial-gradient(circle, transparent 31%, rgb(255 255 255 / 0.06) 31.5%, transparent 32.5%),
    repeating-radial-gradient(circle, #111 0 2px, #1b1b1b 2px 4px), #111;
  animation: spin 24s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
