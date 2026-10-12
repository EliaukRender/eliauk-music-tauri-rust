<script setup lang="ts">
import { computed } from 'vue'

import { useCoverPalette } from '@/composables/useCoverPalette'
import { resizeImage } from '@/utils/format'

const props = defineProps<{ cover: string }>()

const palette = useCoverPalette(() => props.cover)

/** 主色铺成几团径向光斑叠在模糊封面上，弥补浅色或灰暗封面模糊后背景发灰 */
const glow = computed(() => {
  const colors = palette.value
  if (!colors) return ''
  const [a, b, c, d] = colors
  return [
    `radial-gradient(60% 70% at 15% 20%, ${a}, transparent)`,
    `radial-gradient(55% 65% at 85% 25%, ${b}, transparent)`,
    `radial-gradient(60% 70% at 70% 90%, ${c}, transparent)`,
    `radial-gradient(50% 60% at 20% 85%, ${d}, transparent)`,
  ].join(',')
})
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
    <!-- 按配色切换时交叉淡入，渐变本身无法过渡 -->
    <Transition name="lyric-glow">
      <div
        v-if="glow"
        :key="glow"
        class="absolute inset-0 opacity-45"
        :style="{ backgroundImage: glow }"
      />
    </Transition>
    <div class="absolute inset-0 bg-black/45" />
  </div>
</template>

<style scoped>
.lyric-glow-enter-active,
.lyric-glow-leave-active {
  transition: opacity 0.8s ease;
}

.lyric-glow-enter-from,
.lyric-glow-leave-to {
  opacity: 0;
}
</style>
